"""
Datamodeller för fastighetsvärdering
Innehåller alla strukturer för data som extraheras från protokoll
"""
from dataclasses import dataclass
from typing import Optional, List, Dict
from enum import Enum
from datetime import date


class Energiklass(str, Enum):
    """Energiklasser enligt Boverket"""
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"


class Riskniva(str, Enum):
    """Riskivåer för Property Health Index"""
    LAG = "Låg"
    MEDEL = "Medel"
    HOG = "Hög"


class Uppvarmningssystem(str, Enum):
    """Typer av uppvärmningssystem"""
    FJARR = "Fjärrvärme"
    BERGVARME = "Bergvärme"
    DIREKTEL = "Direktverkande el"
    LUFT_VATTEN = "Luft/vatten värmepump"
    LUFT_LUFT = "Luft/luft värmepump"
    OLJA = "Olja"
    PELLETS = "Pellets"


class VentilationsTyp(str, Enum):
    """Typer av ventilationssystem"""
    FTX = "FTX"  # Från- och tilluft med återvinning
    FT = "FT"    # Från- och tilluft
    F = "F"      # Frånluft
    SJALVDRAG = "Självdrag"


@dataclass
class Energideklaration:
    """Data från energideklaration"""
    # Required fields först
    deklarations_id: str
    adress: str
    postnummer: str
    postort: str
    kommun: str
    nybyggnadsar: int
    atemp: float  # m²
    byggnadskategori: str
    energiklass: Energiklass
    primärenergital: float  # kWh/m² och år
    specifik_energianvandning: float  # kWh/m² och år
    energianvandning_totalt: float  # kWh/år
    uppvarmningssystem: Uppvarmningssystem
    
    # Optional fields sist
    antal_lagenheter: Optional[int] = None
    ventilationstyp: Optional[VentilationsTyp] = None
    
    # Kontroller
    ovk_utford: bool = False
    radon_matning_utford: bool = False
    
    # Åtgärdsförslag
    atgardsforslag_finns: bool = False
    minskad_energianvandning_potential: Optional[float] = None  # kWh/år
    kostnad_per_sparad_kwh: Optional[float] = None  # kr/kWh
    
    # Validitet
    giltig_till: Optional[date] = None
    upprattad_datum: Optional[date] = None
    
    # Energifördelning
    fjarr_uppvarmning: Optional[float] = None  # kWh
    el_tappvarmvatten: Optional[float] = None  # kWh
    fastighetsel: Optional[float] = None  # kWh


@dataclass
class OVKData:
    """Data från OVK-protokoll (Obligatorisk Ventilationskontroll)"""
    ventilationstyp: VentilationsTyp
    ovk_utford: bool
    ovk_utan_anmarkning: bool
    
    # Inspektionsdetaljer
    inspektionsdatum: Optional[date] = None
    nasta_inspektion: Optional[date] = None
    
    # System
    aggregat_antal: Optional[int] = None
    flaktor_antal: Optional[int] = None
    
    # Brister om några
    brister: Optional[List[str]] = None
    atgarder_rekommenderade: Optional[List[str]] = None


@dataclass
class MarknadsData:
    """Data från Booli/Hemnet/SCB"""
    # Booli/Hemnet
    senaste_forsaljningar: Optional[List[Dict]] = None
    genomsnittspris_omrade: Optional[float] = None  # kr/m²
    prishistorik: Optional[List[Dict]] = None
    
    # SCB
    befolkning_omrade: Optional[int] = None
    inkomst_medel: Optional[float] = None
    pendlingsavstand: Optional[float] = None


@dataclass
class PropertyHealthIndex:
    """Beräknad hälsoindex för fastighet"""
    index_varde: float  # 0-100
    riskniva: Riskniva
    konfidens: float  # 0-1
    
    # Delpoäng
    byggnadstekniskt: int  # 0-100
    ekonomi: int  # 0-100
    lage_bekvamhet: int  # 0-100
    underhall_renovering: int  # 0-100
    miljo_energi: int  # 0-100
    marknadsindikatorer: int  # 0-100
    
    # Faktorer
    faktorer_positiva: List[str]
    faktorer_negativa: List[str]


@dataclass
class Vardering:
    """AI-genererad värdering"""
    vardeintervall_min: float  # SEK
    vardeintervall_max: float  # SEK
    vardering_mest_sannolik: float  # SEK
    
    # Modellinfo
    modell_typ: str  # "XGBoost", "Regression", "Ensemble"
    konfidens: float  # 0-1
    
    # Prisuppdelning
    pris_per_kvm: float  # SEK/m²
    
    # Jämförelse
    jamforelse_omrade: Optional[float] = None  # % över/under medel
    jamforelse_liknande: Optional[float] = None  # % över/under liknande objekt


@dataclass
class Riskmodell:
    """AI-genererad riskbedömning"""
    halso_riskindex: float  # 0-100
    finansiell_risk: float  # 0-100
    
    # Specifika risker
    energi_risk: float  # 0-100
    underhalls_risk: float  # 0-100
    miljo_risk: float  # 0-100
    
    # Rekommendationer
    rekommendationer: List[str]
    prioriterade_atgarder: List[Dict]  # {'åtgärd': str, 'kostnad': float, 'prioritet': int}


@dataclass
class KompletteradVardering:
    """Slutlig komplett värdering med alla data"""
    # Grunddata
    adress: str
    boyta: float
    nybyggnadsar: int
    
    # Extraherad data
    energideklaration: Energideklaration
    ovk_data: Optional[OVKData]
    marknadsdata: MarknadsData
    
    # AI-genererad analys
    property_health: PropertyHealthIndex
    vardering: Vardering
    riskmodell: Riskmodell
    
    # Månadsavgift och ekonomi
    manadsavgift: Optional[float] = None  # SEK
    
    # Genererad rapport
    rapport_url: Optional[str] = None
    rapport_pdf_path: Optional[str] = None
    
    # Metadata
    skapad: date = None
    version: str = "1.0"


@dataclass
class ProtokollInput:
    """Input för protokollextraktion"""
    file_path: str
    file_type: str  # 'pdf', 'excel', 'xlsm'
    protokoll_typ: str  # 'energideklaration', 'ovk', 'besiktning'


@dataclass
class ExtraktionsResultat:
    """Resultat från extraktion"""
    success: bool
    data: Optional[Dict]
    error: Optional[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []
