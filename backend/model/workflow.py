"""
Temporal Workflow för fastighetsvärdering
Orkestrerar hela processen från datahämtning till färdig rapport
"""
from datetime import timedelta
from typing import Dict, Optional
from temporalio import workflow, activity
from temporalio.common import RetryPolicy

from models import (
    ProtokollInput,
    Energideklaration,
    OVKData,
    MarknadsData,
    PropertyHealthIndex,
    Vardering,
    Riskmodell,
    KompletteradVardering,
    ExtraktionsResultat
)


# ============= ACTIVITIES =============

@activity.defn
async def hamta_basdata(adress: str, boyta: float, protokoll_paths: Dict[str, str]) -> Dict:
    """
    Steg 1: Hämta basdata om fastighet/lägenhet
    """
    activity.logger.info(f"Hämtar basdata för {adress}, {boyta} m²")
    
    return {
        'adress': adress,
        'boyta': boyta,
        'protokoll_energi': protokoll_paths.get('energideklaration'),
        'protokoll_ovk': protokoll_paths.get('ovk'),
        'upplatelseform': 'Bostadsrätt'  # Eller 'Äganderätt'
    }


@activity.defn
async def hamta_marknadsdata(adress: str, boyta: float) -> MarknadsData:
    """
    Steg 2: Hämta marknadsdata från Booli/Hemnet/SCB
    """
    activity.logger.info(f"Hämtar marknadsdata för {adress}")
    
    # TODO: Implementera faktiska API-anrop till Booli/Hemnet/SCB
    # Detta är en placeholder-implementation
    
    import httpx
    
    # Exempel: Booli API-anrop (kräver API-nyckel)
    # async with httpx.AsyncClient() as client:
    #     response = await client.get(
    #         "https://api.booli.se/listings",
    #         params={'q': adress}
    #     )
    #     booli_data = response.json()
    
    # Placeholder-data
    marknadsdata = MarknadsData(
        senaste_forsaljningar=[
            {'pris': 3950000, 'datum': '2024-08-15', 'boyta': 64},
            {'pris': 4100000, 'datum': '2024-06-20', 'boyta': 68}
        ],
        genomsnittspris_omrade=61720.0,  # kr/m²
        befolkning_omrade=75000,
        inkomst_medel=35000.0
    )
    
    return marknadsdata


@activity.defn
async def extrahera_energideklaration(protokoll_input: ProtokollInput) -> ExtraktionsResultat:
    """
    Steg 3a: Extrahera data från energideklaration (PDF)
    """
    activity.logger.info(f"Extraherar energideklaration från {protokoll_input.file_path}")
    
    from pdf_extractor import EnergideklarationExtractor
    
    extractor = EnergideklarationExtractor()
    result = extractor.extract(protokoll_input.file_path)
    
    if result.warnings:
        for warning in result.warnings:
            activity.logger.warning(warning)
    
    return result


@activity.defn
async def extrahera_ovk_protokoll(protokoll_input: ProtokollInput) -> ExtraktionsResultat:
    """
    Steg 3b: Extrahera data från OVK-protokoll (Excel)
    """
    activity.logger.info(f"Extraherar OVK-data från {protokoll_input.file_path}")
    
    from excel_extractor import OVKExtractor
    
    extractor = OVKExtractor()
    result = extractor.extract(protokoll_input.file_path)
    
    if result.warnings:
        for warning in result.warnings:
            activity.logger.warning(warning)
    
    return result


@activity.defn
async def berakna_property_health_index(
    energideklaration: Dict,
    ovk_data: Optional[Dict],
    marknadsdata: Dict
) -> PropertyHealthIndex:
    """
    Steg 4: Beräkna Property Health Index
    """
    activity.logger.info("Beräknar Property Health Index")
    
    # Poängsystem 0-100 för olika kategorier
    
    # 1. Byggnadstekniskt (20%)
    byggnadstekniskt = 70
    if energideklaration.get('nybyggnadsar', 0) > 2000:
        byggnadstekniskt += 15
    elif energideklaration.get('nybyggnadsar', 0) > 1980:
        byggnadstekniskt += 5
    else:
        byggnadstekniskt -= 10
    
    # 2. Ekonomi (30%)
    ekonomi = 60
    manadsavgift_per_kvm = 3950 / energideklaration.get('boyta', 64)  # placeholder
    if manadsavgift_per_kvm < 800:
        ekonomi += 20
    elif manadsavgift_per_kvm > 1200:
        ekonomi -= 20
    
    # 3. Läge & Bekvämlighet (15%)
    lage_bekvamhet = 75
    
    # 4. Underhåll & Renovering (15%)
    underhall = 65
    if energideklaration.get('atgardsforslag_finns'):
        underhall -= 15
    
    # 5. Miljö & Energi (10%)
    miljo_energi = 50
    energiklass = energideklaration.get('energiklass', 'G')
    energi_points = {'A': 100, 'B': 85, 'C': 70, 'D': 55, 'E': 40, 'F': 25, 'G': 10}
    miljo_energi = energi_points.get(energiklass, 50)
    
    # 6. Marknadsindikatorer (10%)
    marknadsindikatorer = 70
    
    # Viktad summa
    index_varde = (
        byggnadstekniskt * 0.20 +
        ekonomi * 0.30 +
        lage_bekvamlet * 0.15 +
        underhall * 0.15 +
        miljo_energi * 0.10 +
        marknadsindikatorer * 0.10
    )
    
    # Bestäm risknivå
    from models import Riskniva
    if index_varde >= 70:
        riskniva = Riskniva.LAG
    elif index_varde >= 50:
        riskniva = Riskniva.MEDEL
    else:
        riskniva = Riskniva.HOG
    
    # Identifiera faktorer
    faktorer_positiva = []
    faktorer_negativa = []
    
    if miljo_energi > 70:
        faktorer_positiva.append(f"Bra energiklass ({energiklass})")
    else:
        faktorer_negativa.append(f"Låg energiklass ({energiklass})")
    
    if ovk_data and ovk_data.get('ovk_utan_anmarkning'):
        faktorer_positiva.append("OVK utan anmärkningar")
    
    if energideklaration.get('nybyggnadsar', 0) > 2000:
        faktorer_positiva.append("Relativt ny byggnad")
    elif energideklaration.get('nybyggnadsar', 0) < 1980:
        faktorer_negativa.append("Äldre byggnad")
    
    return PropertyHealthIndex(
        index_varde=round(index_varde, 1),
        riskniva=riskniva,
        konfidens=0.85,
        byggnadstekniskt=int(byggnadstekniskt),
        ekonomi=int(ekonomi),
        lage_bekvamhet=int(lage_bekvamhet),
        underhall_renovering=int(underhall),
        miljo_energi=int(miljo_energi),
        marknadsindikatorer=int(marknadsindikatorer),
        faktorer_positiva=faktorer_positiva,
        faktorer_negativa=faktorer_negativa
    )


@activity.defn
async def ai_vardering_xgboost(
    basdata: Dict,
    energideklaration: Dict,
    marknadsdata: Dict,
    health_index: Dict
) -> Vardering:
    """
    Steg 5: AI-värdering med XGBoost/Regression
    """
    activity.logger.info("Kör AI-värdering med XGBoost")
    
    # TODO: Implementera faktisk ML-modell
    # Detta är en förenklad placeholder
    
    boyta = basdata['boyta']
    genomsnitt_pris_kvm = marknadsdata.get('genomsnittspris_omrade', 60000)
    
    # Justera pris baserat på faktorer
    justering = 1.0
    
    # Energiklass-justering
    energiklass = energideklaration.get('energiklass', 'G')
    energi_justeringar = {'A': 1.10, 'B': 1.05, 'C': 1.00, 'D': 0.98, 'E': 0.95, 'F': 0.92, 'G': 0.88}
    justering *= energi_justeringar.get(energiklass, 1.0)
    
    # Health index-justering
    health_varde = health_index['index_varde']
    if health_varde > 75:
        justering *= 1.05
    elif health_varde < 50:
        justering *= 0.95
    
    # Beräkna värde
    pris_per_kvm = genomsnitt_pris_kvm * justering
    mest_sannolik_vardering = pris_per_kvm * boyta
    
    # Intervall ±10%
    vardeintervall_min = mest_sannolik_vardering * 0.90
    vardeintervall_max = mest_sannolik_vardering * 1.10
    
    return Vardering(
        vardeintervall_min=round(vardeintervall_min, 0),
        vardeintervall_max=round(vardeintervall_max, 0),
        vardering_mest_sannolik=round(mest_sannolik_vardering, 0),
        modell_typ="XGBoost + Regression Ensemble",
        konfidens=0.82,
        pris_per_kvm=round(pris_per_kvm, 0),
        jamforelse_omrade=round((justering - 1.0) * 100, 1)
    )


@activity.defn
async def ai_riskmodell(
    energideklaration: Dict,
    health_index: Dict,
    ovk_data: Optional[Dict]
) -> Riskmodell:
    """
    Steg 6: AI Riskmodell - Hälsa & riskindex
    """
    activity.logger.info("Kör AI riskmodell")
    
    # Beräkna risker
    energi_risk = 100 - health_index['miljo_energi']
    underhalls_risk = 100 - health_index['underhall_renovering']
    
    miljo_risk = 30.0
    if not energideklaration.get('radon_matning_utford'):
        miljo_risk += 20
    
    halso_riskindex = (energi_risk + underhalls_risk + miljo_risk) / 3
    finansiell_risk = 100 - health_index['ekonomi']
    
    # Generera rekommendationer
    rekommendationer = []
    prioriterade_atgarder = []
    
    if energideklaration.get('energiklass') in ['E', 'F', 'G']:
        rekommendationer.append("Överväg energieffektiviseringsåtgärder för att sänka driftskostnader")
        prioriterade_atgarder.append({
            'åtgärd': 'Tilläggsisolering väggar',
            'kostnad': 150000,
            'prioritet': 1
        })
    
    if not energideklaration.get('radon_matning_utford'):
        rekommendationer.append("Utför radonmätning för att säkerställa hälsosam inomhusmiljö")
        prioriterade_atgarder.append({
            'åtgärd': 'Radonmätning',
            'kostnad': 3000,
            'prioritet': 2
        })
    
    if ovk_data and not ovk_data.get('ovk_utan_anmarkning'):
        rekommendationer.append("Åtgärda brister från OVK-kontroll")
        prioriterade_atgarder.append({
            'åtgärd': 'Ventilationsåtgärder enligt OVK',
            'kostnad': 25000,
            'prioritet': 1
        })
    
    return Riskmodell(
        halso_riskindex=round(halso_riskindex, 1),
        finansiell_risk=round(finansiell_risk, 1),
        energi_risk=round(energi_risk, 1),
        underhalls_risk=round(underhalls_risk, 1),
        miljo_risk=round(miljo_risk, 1),
        rekommendationer=rekommendationer,
        prioriterade_atgarder=prioriterade_atgarder
    )


@activity.defn
async def generera_rapport(
    komplett_data: Dict
) -> Dict[str, str]:
    """
    Steg 7: Sammanfattning + Rapport (PDF & API-utdata)
    """
    activity.logger.info("Genererar rapport")
    
    # TODO: Implementera faktisk rapportgenerering med tex reportlab eller weasyprint
    # Detta är placeholder
    
    return {
        'rapport_pdf_path': '/output/varderingsrapport.pdf',
        'rapport_url': 'https://example.com/reports/12345',
        'api_data_json': '/output/api_data.json'
    }


# ============= WORKFLOW =============

@workflow.defn
class FastighetsvarderingWorkflow:
    """
    Huvudworkflow för fastighetsvärdering
    Orkestrerar alla steg från datainsamling till färdig rapport
    """
    
    @workflow.run
    async def run(
        self,
        adress: str,
        boyta: float,
        manadsavgift: float,
        protokoll_paths: Dict[str, str]
    ) -> KompletteradVardering:
        """
        Kör hela värderingsprocessen
        
        Args:
            adress: Fastighetens adress (ex: "Storgatan 12, 3 tr")
            boyta: Bostadsarea i m²
            manadsavgift: Månadsavgift i SEK
            protokoll_paths: Dict med sökvägar till protokoll
                {'energideklaration': '/path/to/energi.pdf', 'ovk': '/path/to/ovk.xlsm'}
        """
        
        # Retry policy för aktiviteter
        retry_policy = RetryPolicy(
            maximum_attempts=3,
            initial_interval=timedelta(seconds=1),
            maximum_interval=timedelta(seconds=10),
            backoff_coefficient=2.0
        )
        
        workflow.logger.info(f"Startar värdering för {adress}")
        
        # ===== STEG 1: Hämta basdata =====
        basdata = await workflow.execute_activity(
            hamta_basdata,
            args=[adress, boyta, protokoll_paths],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy
        )
        workflow.logger.info("✓ Steg 1: Basdata hämtad")
        
        # ===== STEG 2: Hämta marknadsdata =====
        marknadsdata = await workflow.execute_activity(
            hamta_marknadsdata,
            args=[adress, boyta],
            start_to_close_timeout=timedelta(minutes=2),
            retry_policy=retry_policy
        )
        workflow.logger.info("✓ Steg 2: Marknadsdata hämtad")
        
        # ===== STEG 3: Extrahera kostnadsdata från protokoll =====
        
        # 3a: Energideklaration
        energi_result = None
        if basdata.get('protokoll_energi'):
            energi_input = ProtokollInput(
                file_path=basdata['protokoll_energi'],
                file_type='pdf',
                protokoll_typ='energideklaration'
            )
            
            energi_result = await workflow.execute_activity(
                extrahera_energideklaration,
                args=[energi_input],
                start_to_close_timeout=timedelta(minutes=5),
                retry_policy=retry_policy
            )
            
            if not energi_result.success:
                workflow.logger.error(f"Energideklaration misslyckades: {energi_result.error}")
                raise Exception(f"Kunde inte extrahera energideklaration: {energi_result.error}")
        
        workflow.logger.info("✓ Steg 3a: Energideklaration extraherad")
        
        # 3b: OVK-protokoll
        ovk_result = None
        if basdata.get('protokoll_ovk'):
            ovk_input = ProtokollInput(
                file_path=basdata['protokoll_ovk'],
                file_type='xlsm',
                protokoll_typ='ovk'
            )
            
            ovk_result = await workflow.execute_activity(
                extrahera_ovk_protokoll,
                args=[ovk_input],
                start_to_close_timeout=timedelta(minutes=2),
                retry_policy=retry_policy
            )
            
            if not ovk_result.success:
                workflow.logger.warning(f"OVK-extraktion misslyckades: {ovk_result.error}")
                # Fortsätt ändå, OVK är inte kritiskt
        
        workflow.logger.info("✓ Steg 3b: OVK-data extraherad")
        
        # ===== STEG 4: OVK & Energideklaration (redan gjort i steg 3) =====
        workflow.logger.info("✓ Steg 4: Energi & OVK komplett")
        
        # ===== STEG 5: AI Värdering (XGBoost/Reg.) =====
        health_index = await workflow.execute_activity(
            berakna_property_health_index,
            args=[
                energi_result.data if energi_result else {},
                ovk_result.data if ovk_result else None,
                marknadsdata.__dict__
            ],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy
        )
        workflow.logger.info("✓ Steg 5a: Property Health Index beräknad")
        
        vardering = await workflow.execute_activity(
            ai_vardering_xgboost,
            args=[
                basdata,
                energi_result.data if energi_result else {},
                marknadsdata.__dict__,
                health_index.__dict__
            ],
            start_to_close_timeout=timedelta(minutes=1),
            retry_policy=retry_policy
        )
        workflow.logger.info("✓ Steg 5b: AI-värdering klar")
        
        # ===== STEG 6: AI Riskmodell =====
        riskmodell = await workflow.execute_activity(
            ai_riskmodell,
            args=[
                energi_result.data if energi_result else {},
                health_index.__dict__,
                ovk_result.data if ovk_result else None
            ],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy
        )
        workflow.logger.info("✓ Steg 6: Riskmodell klar")
        
        # ===== STEG 7: Sammanfattning + Rapport =====
        from datetime import date
        
        komplett_vardering = KompletteradVardering(
            adress=adress,
            boyta=boyta,
            nybyggnadsar=energi_result.data.get('nybyggnadsar', 0) if energi_result else 0,
            energideklaration=Energideklaration(**energi_result.data) if energi_result else None,
            ovk_data=OVKData(**ovk_result.data) if ovk_result and ovk_result.success else None,
            marknadsdata=marknadsdata,
            property_health=health_index,
            vardering=vardering,
            riskmodell=riskmodell,
            manadsavgift=manadsavgift,
            skapad=date.today()
        )
        
        rapport_info = await workflow.execute_activity(
            generera_rapport,
            args=[komplett_vardering.__dict__],
            start_to_close_timeout=timedelta(minutes=3),
            retry_policy=retry_policy
        )
        
        komplett_vardering.rapport_pdf_path = rapport_info['rapport_pdf_path']
        komplett_vardering.rapport_url = rapport_info['rapport_url']
        
        workflow.logger.info("✓ Steg 7: Rapport genererad")
        workflow.logger.info(f"✓✓✓ Värdering klar för {adress}: {vardering.vardering_mest_sannolik} SEK")
        
        return komplett_vardering
