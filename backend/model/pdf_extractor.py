"""
Extrahera data från PDF energideklarationer
Använder PyMuPDF (fitz) och pdfplumber för robust extraktion
"""
import re
from typing import Optional, Dict, Any
from datetime import datetime
import fitz  # PyMuPDF
import pdfplumber
from models import (
    Energideklaration, 
    Energiklass, 
    Uppvarmningssystem,
    VentilationsTyp,
    ExtraktionsResultat
)


class EnergideklarationExtractor:
    """Extrahera data från energideklarations-PDF"""
    
    def __init__(self):
        self.warnings = []
    
    def extract(self, pdf_path: str) -> ExtraktionsResultat:
        """
        Huvudmetod för att extrahera all data från energideklaration
        """
        try:
            data = {}
            
            # Använd båda biblioteken för robust extraktion
            with fitz.open(pdf_path) as doc:
                full_text = ""
                for page in doc:
                    full_text += page.get_text()
            
            # Extrahera olika fält
            data['deklarations_id'] = self._extract_deklarations_id(full_text)
            data['adress'] = self._extract_adress(full_text)
            data['postnummer'], data['postort'] = self._extract_postnummer_postort(full_text)
            data['kommun'] = self._extract_kommun(full_text)
            data['nybyggnadsar'] = self._extract_nybyggnadsar(full_text)
            data['atemp'] = self._extract_atemp(full_text)
            data['byggnadskategori'] = self._extract_byggnadskategori(full_text)
            data['energiklass'] = self._extract_energiklass(full_text)
            data['primärenergital'] = self._extract_primärenergital(full_text)
            data['specifik_energianvandning'] = self._extract_specifik_energianvandning(full_text)
            data['energianvandning_totalt'] = self._extract_energianvandning_totalt(full_text)
            data['uppvarmningssystem'] = self._extract_uppvarmningssystem(full_text)
            data['ventilationstyp'] = self._extract_ventilationstyp(full_text)
            data['ovk_utford'] = self._extract_ovk_status(full_text)
            data['radon_matning_utford'] = self._extract_radon_status(full_text)
            data['atgardsforslag_finns'] = self._extract_atgardsforslag_status(full_text)
            data['giltig_till'] = self._extract_giltig_till(full_text)
            
            # Extrahera energifördelning från tabell
            energy_data = self._extract_energy_breakdown(pdf_path)
            data.update(energy_data)
            
            # Extrahera åtgärdsförslag om finns
            if data['atgardsforslag_finns']:
                atgard_data = self._extract_atgardsforslag(full_text)
                data.update(atgard_data)
            
            # Skapa Energideklaration objekt
            energideklaration = Energideklaration(**data)
            
            return ExtraktionsResultat(
                success=True,
                data=energideklaration.__dict__,
                warnings=self.warnings
            )
            
        except Exception as e:
            return ExtraktionsResultat(
                success=False,
                data=None,
                error=str(e)
            )
    
    def _extract_deklarations_id(self, text: str) -> str:
        """Extrahera Energideklarations-ID"""
        pattern = r'Energideklarations?-?ID[:\s]+(\d+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
        self.warnings.append("Kunde inte hitta Energideklarations-ID")
        return ""
    
    def _extract_adress(self, text: str) -> str:
        """Extrahera adress"""
        # Hitta adress före postnummer
        pattern = r'(?:Adress[:\s]+)?([A-ZÅÄÖ][a-zåäö]+(?:\s+\d+)?)\s*\n?\s*(\d{3}\s?\d{2})'
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
        
        # Alternativt mönster
        pattern2 = r'([A-ZÅÄÖ][a-zåäö]+),?\s+\d{3}\s?\d{2}'
        match2 = re.search(pattern2, text)
        if match2:
            return match2.group(1).strip()
        
        self.warnings.append("Kunde inte extrahera adress korrekt")
        return ""
    
    def _extract_postnummer_postort(self, text: str) -> tuple:
        """Extrahera postnummer och postort"""
        pattern = r'(\d{3}\s?\d{2})\s+([A-ZÅÄÖ]+)'
        match = re.search(pattern, text)
        if match:
            postnummer = match.group(1).replace(' ', '')
            postort = match.group(2)
            return postnummer, postort
        return "", ""
    
    def _extract_kommun(self, text: str) -> str:
        """Extrahera kommun"""
        pattern = r'([A-ZÅÄÖ][a-zåäö]+)\s+kommun'
        match = re.search(pattern, text)
        if match:
            return match.group(1)
        return ""
    
    def _extract_nybyggnadsar(self, text: str) -> int:
        """Extrahera nybyggnadsår"""
        pattern = r'Nybyggnadsår[:\s]+(\d{4})'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 0
    
    def _extract_atemp(self, text: str) -> float:
        """Extrahera Atemp (tempererad area)"""
        pattern = r'Atemp[^)]*\)?\s*(\d+(?:,\d+)?)\s*m'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).replace(',', '.')
            return float(value)
        return 0.0
    
    def _extract_byggnadskategori(self, text: str) -> str:
        """Extrahera byggnadskategori"""
        pattern = r'Byggnadskategori[:\s]+([^\n]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        
        # Alternativt mönster
        if 'Lokalbyggnader' in text:
            return 'Lokalbyggnader'
        elif 'Flerbostadshus' in text or 'bostadshus' in text.lower():
            return 'Flerbostadshus'
        elif 'Småhus' in text or 'småhus' in text.lower():
            return 'Småhus'
        
        return 'Okänd'
    
    def _extract_energianvandning_totalt(self, text: str) -> float:
        """Extrahera total energianvändning"""
        # Leta efter byggnadens energianvändning
        pattern = r'Byggnadens energianvändning[^:]*:\s*(\d+)\s*kWh/?år'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1))
        
        # Alternativt: beräkna från specifik energi * atemp
        spec_pattern = r'(\d+)\s*kWh/m.*år'
        atemp_pattern = r'(\d+)\s*m²'
        
        spec_match = re.search(spec_pattern, text)
        atemp_match = re.search(atemp_pattern, text)
        
        if spec_match and atemp_match:
            return float(spec_match.group(1)) * float(atemp_match.group(1))
        
        return 0.0
    
    def _extract_energiklass(self, text: str) -> Energiklass:
        """Extrahera energiklass"""
        # Leta efter energiklass i sammanfattningen
        pattern = r'DENNA BYGGNADS\s+ENERGIKLASS\s+([A-G])'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            klass = match.group(1).upper()
            return Energiklass(klass)
        
        # Alternativt sätt - leta efter energiklassmarkering
        for klass in ['A', 'B', 'C', 'D', 'E', 'F', 'G']:
            if f"ENERGIKLASS\n{klass}" in text or f"ENERGIKLASS {klass}" in text:
                return Energiklass(klass)
        
        self.warnings.append("Kunde inte identifiera energiklass")
        return Energiklass.G
    
    def _extract_primärenergital(self, text: str) -> float:
        """Extrahera primärenergital"""
        pattern = r'Energiprestanda,?\s*primärenergital[:\s]+(\d+)\s*kWh/m'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1))
        
        # Alternativt mönster
        pattern2 = r'primärenergital[:\s]+(\d+)\s*kWh'
        match2 = re.search(pattern2, text, re.IGNORECASE)
        if match2:
            return float(match2.group(1))
        
        return 0.0
    
    def _extract_specifik_energianvandning(self, text: str) -> float:
        """Extrahera specifik energianvändning"""
        pattern = r'Specifik energianvändning[^:]*:\s*(\d+)\s*kWh/m'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1))
        return 0.0
    
    def _extract_uppvarmningssystem(self, text: str) -> Uppvarmningssystem:
        """Extrahera uppvärmningssystem"""
        text_lower = text.lower()
        
        if 'fjärrvärme' in text_lower:
            return Uppvarmningssystem.FJARR
        elif 'bergvärme' in text_lower or 'berg värme' in text_lower:
            return Uppvarmningssystem.BERGVARME
        elif 'luft/vatten' in text_lower or 'luftvatten' in text_lower:
            return Uppvarmningssystem.LUFT_VATTEN
        elif 'luft/luft' in text_lower or 'luftluft' in text_lower:
            return Uppvarmningssystem.LUFT_LUFT
        elif 'direktverkande' in text_lower or 'direktel' in text_lower:
            return Uppvarmningssystem.DIREKTEL
        elif 'olja' in text_lower:
            return Uppvarmningssystem.OLJA
        elif 'pellets' in text_lower:
            return Uppvarmningssystem.PELLETS
        
        self.warnings.append("Kunde inte identifiera uppvärmningssystem")
        return Uppvarmningssystem.FJARR  # Default
    
    def _extract_ventilationstyp(self, text: str) -> Optional[VentilationsTyp]:
        """Extrahera ventilationstyp"""
        pattern = r'Typ av ventilationssystem[:\s]+(FTX|FT|F|Självdrag)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            typ = match.group(1).upper()
            if typ == 'FTX':
                return VentilationsTyp.FTX
            elif typ == 'FT':
                return VentilationsTyp.FT
            elif typ == 'F':
                return VentilationsTyp.F
            elif typ.lower() == 'självdrag':
                return VentilationsTyp.SJALVDRAG
        return None
    
    def _extract_ovk_status(self, text: str) -> bool:
        """Kontrollera om OVK är utförd"""
        pattern = r'Ventilationskontroll[^:]*OVK[^:]*:\s*(Utförd|Inte utförd)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return 'utförd' in match.group(1).lower() and 'inte' not in match.group(1).lower()
        return False
    
    def _extract_radon_status(self, text: str) -> bool:
        """Kontrollera om radonmätning är utförd"""
        pattern = r'Radonmätning[:\s]+(Utförd|Inte utförd)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return 'utförd' in match.group(1).lower() and 'inte' not in match.group(1).lower()
        return False
    
    def _extract_atgardsforslag_status(self, text: str) -> bool:
        """Kontrollera om åtgärdsförslag finns"""
        pattern = r'Åtgärdsförslag[:\s]+(Har lämnats|Finns)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return True
        return False
    
    def _extract_giltig_till(self, text: str) -> Optional[datetime]:
        """Extrahera giltighetsdatum"""
        pattern = r'Energideklarationen är giltig till[:\s]+(\d{4}-\d{2}-\d{2})'
        match = re.search(pattern, text)
        if match:
            return datetime.strptime(match.group(1), '%Y-%m-%d').date()
        return None
    
    def _extract_energy_breakdown(self, pdf_path: str) -> Dict[str, float]:
        """
        Extrahera energifördelning från tabelldata
        Använder pdfplumber för tabellextraktion
        """
        result = {
            'fjarr_uppvarmning': None,
            'el_tappvarmvatten': None,
            'fastighetsel': None,
            'energianvandning_totalt': None
        }
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            if row and len(row) >= 2:
                                # Fjärrvärme
                                if row[0] and 'fjärrvärme' in str(row[0]).lower():
                                    try:
                                        result['fjarr_uppvarmning'] = self._parse_number(row[1])
                                    except:
                                        pass
                                
                                # El för tappvarmvatten
                                if row[0] and 'tappvarmvatten' in str(row[0]).lower() and 'el' in str(row[0]).lower():
                                    try:
                                        result['el_tappvarmvatten'] = self._parse_number(row[-1])
                                    except:
                                        pass
                                
                                # Fastighetsel
                                if row[0] and 'fastighetsel' in str(row[0]).lower():
                                    try:
                                        result['fastighetsel'] = self._parse_number(row[-1])
                                    except:
                                        pass
                                
                                # Total energianvändning
                                if row[0] and 'summa' in str(row[0]).lower():
                                    try:
                                        result['energianvandning_totalt'] = self._parse_number(row[-1])
                                    except:
                                        pass
        except Exception as e:
            self.warnings.append(f"Kunde inte extrahera energifördelning: {e}")
        
        return result
    
    def _extract_atgardsforslag(self, text: str) -> Dict:
        """Extrahera information om åtgärdsförslag"""
        result = {
            'minskad_energianvandning_potential': None,
            'kostnad_per_sparad_kwh': None
        }
        
        # Minskad energianvändning
        pattern = r'Minskad energianvändning[:\s]+(\d+)\s*kWh/?år'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['minskad_energianvandning_potential'] = float(match.group(1))
        
        # Kostnad per sparad kWh
        pattern2 = r'Kostnad per sparad kWh[:\s]+(\d+(?:[.,]\d+)?)\s*kr/kWh'
        match2 = re.search(pattern2, text, re.IGNORECASE)
        if match2:
            value = match2.group(1).replace(',', '.')
            result['kostnad_per_sparad_kwh'] = float(value)
        
        return result
    
    def _parse_number(self, value: Any) -> Optional[float]:
        """Hjälpfunktion för att parse:a nummer från olika format"""
        if value is None:
            return None
        
        # Om redan float/int
        if isinstance(value, (int, float)):
            return float(value)
        
        # Om string
        value_str = str(value).strip()
        
        # Ta bort whitespace och konvertera komma till punkt
        value_str = value_str.replace(' ', '').replace(',', '.')
        
        # Extrahera bara siffror och punkt
        number_pattern = r'(\d+(?:\.\d+)?)'
        match = re.search(number_pattern, value_str)
        if match:
            return float(match.group(1))
        
        return None


# Exempel på användning
if __name__ == "__main__":
    extractor = EnergideklarationExtractor()
    result = extractor.extract("/mnt/user-data/uploads/1429218-dokument-Hoppet.pdf")
    
    if result.success:
        print("✓ Extraktion lyckades!")
        print(f"Deklarations-ID: {result.data['deklarations_id']}")
        print(f"Adress: {result.data['adress']}")
        print(f"Energiklass: {result.data['energiklass']}")
        print(f"Primärenergital: {result.data['primärenergital']} kWh/m²")
    else:
        print(f"✗ Extraktion misslyckades: {result.error}")
    
    if result.warnings:
        print("\nVarningar:")
        for warning in result.warnings:
            print(f"  - {warning}")
