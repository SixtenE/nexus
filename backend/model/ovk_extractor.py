
import re
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
import fitz  # PyMuPDF
import pdfplumber
from datetime import datetime

HEADER_VARIANTS = {
    "plats": {"plats", "rum", "beteckning", "uttag", "donplats"},
    "don_typ": {"don", "don-typ", "dontyp", "typ"},
    "proj_ls": {"proj l/s", "proj. l/s", "projekterat l/s", "projekterat flöde", "proj flöde", "proj", "proj. flöde"},
    "uppm_ls": {"uppm l/s", "uppm. l/s", "uppmätt l/s", "uppm flöde", "uppm", "uppm. flöde"},
    "matmetod": {"mätmetod", "matmetod", "mätning"},
    "anm": {"anm", "anmärkning", "kommentar"},
    "rum": {"rum", "plats"},
    "tilluft_proj": {"tilluft proj", "tilluft proj l/s", "tilluft l/s proj"},
    "tilluft_uppm": {"tilluft uppm", "tilluft uppm l/s", "tilluft l/s uppm"},
    "franluft_proj": {"frånluft proj", "frånluft proj l/s", "frånluft l/s proj", "franluft proj"},
    "franluft_uppm": {"frånluft uppm", "frånluft uppm l/s", "frånluft l/s uppm", "franluft uppm"},
    "temp_c": {"temp", "temperatur", "inomhustemp", "temp (c)", "temp c"},
    "co2_ppm": {"co2", "koldioxid", "co₂", "co2 ppm"},
    "drag": {"drag", "drag (ja/nej)"},
    "klassning": {"klassning", "klass", "kategori"},
    "atgard": {"åtgärd", "åtgärdsförslag", "beskrivning"},
    "ansvarig": {"ansvarig"},
    "deadline": {"deadline", "senast datum", "senast åtgärdad", "senast"},
    "status": {"status", "läge"},
}

def norm(s: Optional[str]) -> str:
    return (s or "").strip().lower()

def as_number(s: Optional[str]) -> Optional[float]:
    if not s:
        return None
    s = str(s).replace(" ", "").replace(",", ".")
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    return float(m.group(1)) if m else None

def normalize_headers(headers: List[str]) -> List[str]:
    return [norm(h) for h in headers]

def map_headers_to_keys(headers: List[str], mapping: Dict[str, set]) -> Dict[int, str]:
    header_norm = normalize_headers(headers)
    colmap: Dict[int, str] = {}
    for idx, h in enumerate(header_norm):
        for canon, variants in mapping.items():
            for v in variants:
                if v in h:
                    colmap[idx] = canon
                    break
    return colmap

@dataclass
class OVKExtractResult:
    success: bool
    data: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    error: Optional[str] = None
    raw_text: Optional[str] = None

class OVKProtokollExtractor:
    def _detect_systemtyp(self, text: str):
        """
        Försök hitta systemtyp (FTX/FT/F/S) i hela dokumentet.
        Stöd för:
          - 'Systemtyp: FTX' eller 'Ventilationssystem: FT'
          - Kryssrutor: '☒ FTX', '[x] FT', '■ F', '(x) S'
          - Rader med flera alternativ (FTX FT F S) där ett har ett X/mark nära.
        """
        t = text

        # Direkta etiketter
        m = re.search(r"(?:Systemtyp|Ventilationssystem)\s*[:\-]?\s*(FTX|FT|F|S)\b", t, re.I)
        if m:
            return m.group(1).upper()

        # Checkbox-varianter före/efter
        m = re.search(r"[☒■\(\[]\s*[xX]?\s*[\)\]]\s*(FTX|FT|F|S)\b", t, re.I)
        if m:
            return m.group(1).upper()
        m = re.search(r"(FTX|FT|F|S)\s*[☒■\(\[]\s*[xX]?\s*[\)\]]", t, re.I)
        if m:
            return m.group(1).upper()

        # Multi-options med X nära ett av alternativen
        for opt in ["FTX", "FT", "F", "S"]:
            for m in re.finditer(opt, t, re.I):
                start = max(0, m.start() - 15)
                end = min(len(t), m.end() + 15)
                window = t[start:end]
                if re.search(r"[xX☒■]", window):
                    return opt.upper()

        return None

    def __init__(self):
        self.warnings: List[str] = []

    def extract(self, pdf_path: str) -> OVKExtractResult:
        try:
            full_text = self._read_text(pdf_path)
            parsed = {
                "A_Blankett": self._parse_a_blankett(full_text),
                "E1": self._parse_e1(full_text),
                "B1": [],
                "L1": [],
                "K1": [],
                "C1": [],
                "D1": [],
                "Intyg": self._parse_intyg(full_text)
            }

            tables = self._extract_tables(pdf_path)
            b1 = self._parse_b1_tables(tables)
            l1 = self._parse_l1_tables(tables)
            k1 = self._parse_k1_tables(tables)
            c1 = self._parse_c1_tables(tables)
            d1 = self._parse_d1_tables(tables)

            if b1: parsed["B1"] = b1
            if l1: parsed["L1"] = l1
            if k1: parsed["K1"] = k1
            if c1: parsed["C1"] = c1
            if d1: parsed["D1"] = d1

            return OVKExtractResult(
                success=True,
                data=parsed,
                warnings=self.warnings,
                raw_text=full_text[:2000]
            )
        except Exception as e:
            return OVKExtractResult(success=False, error=str(e), warnings=self.warnings)

    def _read_text(self, pdf_path: str) -> str:
        text = ""
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text += page.get_text()
        if not text.strip():
            self.warnings.append("PDF saknar extraherbar text (kan vara inskannad). OCR kan behövas.")
        return text

    def _extract_tables(self, pdf_path: str) -> List[List[List[str]]]:
        out = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                try:
                    tbls = page.extract_tables() or []
                    out.extend(tbls)
                except Exception as e:
                    self.warnings.append(f"Kunde inte läsa tabeller på en sida: {e}")
        return out

    # ---------------- A-Blankett ----------------
    def _parse_a_blankett(self, text: str) -> Dict[str, Any]:
        A: Dict[str, Any] = {}
        m = re.search(r"(?:Fastighetsbeteckning|Fastighet\s*beteckning)\s*[:]?\s*([^\n]+)", text, re.I)
        if m: A["fastighetsbeteckning"] = m.group(1).strip()

        m = re.search(r"(?:Adress|Gata)\s*[:]?\s*([^\n]+)", text, re.I)
        if m: A["gata"] = m.group(1).strip()

        m = re.search(r"(\d{3}\s?\d{2})\s+([A-ZÅÄÖa-zåäö\- ]{2,})", text)
        if m:
            A["postnr"] = m.group(1).replace(" ", "")
            A["ort"] = m.group(2).strip()

        m = re.search(r"(?:Verksamhet|Byggnadstyp)\s*[:]?\s*([^\n]+)", text, re.I)
        if m: A["verksamhet"] = m.group(1).strip()

        m = re.search(r"(?:BRA|Bruttoarea|Bruksarea)[^\d]*(\d+(?:[.,]\d+)?)\s*m2", text, re.I)
        if m: A["bra_m2"] = as_number(m.group(1))

        m = re.search(r"Antal\s+lägenheter\s*[:]?\s*(\d+)", text, re.I)
        if m: A["antal_lagenheter"] = int(m.group(1))

        m = re.search(r"(?:Besiktningsman|Besiktningsperson)\s*[:]?\s*([^\n]+)", text, re.I)
        if m: A["besiktningsman"] = m.group(1).strip()

        m = re.search(r"(?:Certifikats?nr\.?|Certifikat)\s*[:]?\s*([A-ZÅÄÖa-zåäö0-9\- ]+)", text, re.I)
        if m: A["certifikat_nr"] = m.group(1).strip()

        m = re.search(r"(?:Behörighet)\s*[:]?\s*([NK])\b", text, re.I)
        if m: A["behörighet"] = m.group(1).upper()

        m = re.search(r"(?:Datum|Besiktningsdatum)\s*[:]?\s*(\d{4}-\d{2}-\d{2}|\d{2}[-/]\d{2}[-/]\d{4})", text, re.I)
        if m:
            val = m.group(1).replace("/", "-")
            try:
                if re.match(r"\d{2}-\d{2}-\d{4}", val):
                    dt = datetime.strptime(val, "%d-%m-%Y").date()
                else:
                    dt = datetime.strptime(val, "%Y-%m-%d").date()
                A["datum"] = dt.isoformat()
            except Exception:
                A["datum_raw"] = m.group(1)
        return A

    # ---------------- E1 ----------------
    def _parse_e1(self, text: str) -> Dict[str, Any]:
        E: Dict[str, Any] = {}
        m = re.search(r"(?:Systemtyp|Ventilationssystem)\s*[:]?\\s*(FTX|FT|F|S)\\b", text, re.I)
        if m:
            E["systemtyp"] = m.group(1).upper()
        else:
            st = self._detect_systemtyp(text)
            if st:
                E["systemtyp"] = st

        m = re.search(r"(?:Projekterat\s*flöde|Proj\.\s*flöde)\s*[:]?\s*(\d+)\s*l/?s", text, re.I)
        if m: E["proj_floede_ls"] = int(m.group(1))

        m = re.search(r"(?:Uppmätt\s*flöde|Uppm\.\s*flöde)\s*[:]?\s*(\d+)\s*l/?s", text, re.I)
        if m: E["uppm_floede_ls"] = int(m.group(1))

        m = re.search(r"SFP\s*[:]?\s*([\d.,]+)", text, re.I)
        if m: E["sfp_kw_per_m3s"] = as_number(m.group(1))

        m = re.search(r"(?:Tilluft\s*filter(?:klass)?)\s*[:]?\s*([A-Za-z0-9% ]+)", text, re.I)
        if m: E["tilluft_filterklass"] = m.group(1).strip()

        m = re.search(r"(?:Frånluft\s*filter(?:klass)?)\s*[:]?\s*([A-Za-z0-9% ]+)", text, re.I)
        if m: E["frånluft_filterklass"] = m.group(1).strip()

        m = re.search(r"(?:Återvinning|Värmeåtervinning)\s*[:]?\s*([A-Za-zÅÄÖåäö ]+)", text, re.I)
        if m: E["återvinning_typ"] = m.group(1).strip()

        m = re.search(r"(?:Värmebatteri)\s*[:]?\s*(Vatten|El)[^\d]*(\d+(?:[.,]\d+)?)?\s*kw", text, re.I)
        if m: E["värmebatteri"] = {"typ": m.group(1), "effekt_kw": as_number(m.group(2))}

        m = re.search(r"(?:Kyla)\s*[:]?\s*(Vatten|DX)[^\d]*(\d+(?:[.,]\d+)?)?\s*kw", text, re.I)
        if m: E["kyla"] = {"typ": m.group(1), "effekt_kw": as_number(m.group(2))}
        return E

    # ---------------- Intyg ----------------
    
    
    def _parse_intyg(self, text: str) -> Dict[str, Any]:
        I: Dict[str, Any] = {}

        # Locate the first INTYG block (take a limited window to avoid table noise)
        m_intyg = re.search(r"INTYG\b", text, re.I)
        block = None
        if m_intyg:
            start_idx = m_intyg.start()
            block = text[start_idx:start_idx+2000]  # window
            I["sektion_hittad"] = True

        # Specialized joint-patterns (labels on one line, values on the next)
        m_pair = re.search(r"Fastighetsbeteckning\s+Adress\s+(?P<fast>.+?)\s+(?P<addr>.+?)\s+System(?:nummer|nr)", block, re.I|re.S)
        if m_pair:
            I["fastighetsbeteckning"] = m_pair.group("fast").strip()
            I["adress"] = m_pair.group("addr").strip()

        m_sys = re.search(r"System(?:nummer|nr)\s+(?P<sys>.+?)\s+(?:Besiktnings\s*rtesultat|Besiktnings\s*resultat|Besiktningsresultat)", block, re.I|re.S)
        if m_sys:
            sysval = re.sub(r"[\r\n]+", " ", m_sys.group("sys")).strip()
            # reject if likely header junk or too long / alphabetic
            if sysval and len(sysval) <= 12 and re.fullmatch(r"[0-9A-Za-z\-/]+", sysval) and not re.fullmatch(r"(Bes\.?kat\.?|Resultat|Anm\.?)", sysval, re.I):
                I["systemnummer"] = sysval

        m_resnxt = re.search(r"(?:Besiktnings\s*rtesultat|Besiktnings\s*resultat|Besiktningsresultat)\s+Nästa\s+(?:ordinarie\s+)?besiktning\s+(?P<res>[GU]|Godkänd|Underkänd)[^\d\n]*?(?P<date>\d{4}-\d{2}-\d{2})", block, re.I|re.S)
        if m_resnxt:
            res_val = m_resnxt.group("res")
            res_val = "Godkänd" if res_val.upper().startswith("G") else ("Underkänd" if res_val.upper().startswith("U") else res_val)
            I["besiktningsresultat"] = res_val
            I["nästa_ordinarie_besiktning"] = m_resnxt.group("date")

        else:
            block = text

        # Helper to extract value between labels inside the block
        def between(lbl, nxt_labels):
            # find label
            m = re.search(lbl + r"\s*[:]*\s*", block, re.I)
            if not m:
                return None
            s = m.end()
            # find nearest next label
            next_pos = len(block)
            for nlbl in nxt_labels:
                m2 = re.search(nlbl + r"\s*[:]*\s*", block[s:], re.I)
                if m2:
                    next_pos = min(next_pos, s + m2.start())
            val = block[s:next_pos]
            # Cleanup
            val = re.sub(r"[\r\n]+", " ", val).strip()
            # Avoid sweeping other labels glued on same line
            # Cut off at double spaces around known labels fragments
            return re.sub(r"\s{2,}.*$", "", val).strip()

        # Define label order as they appear in many INTYG templates
        labels = [
            r"Fastighetsbeteckning",
            r"Adress",
            r"System(?:nummer|nr)",
            r"Besiktnings\s*rtesultat|Besiktnings\s*resultat|Besiktningsresultat",
            r"Nästa\s+(?:ordinarie\s+)?besiktning|Nästa\s+OVK",
        ]

        # Extract sequentially
        fast = between(labels[0], labels[1:]) or None
        if fast:
            # guard against capturing an isolated "G" or date
            _fv = fast
            if re.fullmatch(r"[GU]", _fv, re.I) or re.fullmatch(r"\d{4}-\d{2}-\d{2}", _fv):
                fast = None
        if fast: I["fastighetsbeteckning"] = fast

        addr = between(labels[1], labels[2:]) or None
        if addr: I["adress"] = addr

        sysnr = between(labels[2], labels[3:]) or None
        # Sometimes the value gets eaten and only a header like "Bes.kat." appears; filter such header-ish tokens
        if sysnr and not re.fullmatch(r"(Bes\.?kat\.?|Resultat|G|U|Anm\.?)", sysnr, re.I):
            I["systemnummer"] = sysnr

        res = between(labels[3], labels[4:]) or None
        if res:
            res_clean = res.strip().upper()
            if res_clean.startswith("G"):
                I["besiktningsresultat"] = "Godkänd"
            elif res_clean.startswith("U"):
                I["besiktningsresultat"] = "Underkänd"
            else:
                I["besiktningsresultat"] = res.strip()

        nxt = between(labels[4], []) or None
        if nxt:
            v = nxt.replace("/", "-").strip()
            try:
                if re.match(r"^\d{2}-\d{2}-\d{4}$", v):
                    I["nästa_ordinarie_besiktning"] = datetime.strptime(v, "%d-%m-%Y").date().isoformat()
                elif re.match(r"^\d{4}-\d{2}-\d{2}$", v):
                    I["nästa_ordinarie_besiktning"] = v
                else:
                    I["nästa_ordinarie_besiktning_raw"] = nxt
            except Exception:
                I["nästa_ordinarie_besiktning_raw"] = nxt

        # Besiktningsdatum (global fallback + try to catch near A1 or in heading rows)
        m = re.search(r"(?:Besiktningsdatum)\s*[:]*\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}[/-][0-9]{2}[/-][0-9]{4})", text, re.I)
        if m:
            val = m.group(1).replace("/", "-")
            try:
                if re.match(r"\d{2}-\d{2}-\d{4}", val):
                    dt = datetime.strptime(val, "%d-%m-%Y").date()
                else:
                    dt = datetime.strptime(val, "%Y-%m-%d").date()
                I["besiktningsdatum"] = dt.isoformat()
            except Exception:
                I["besiktningsdatum_raw"] = m.group(1)
        else:
            # fallback: earliest date in INTYG block
            m2 = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", block)
            if m2:
                I["besiktningsdatum"] = m2.group(1)


        # Fallback fill from A1 summary if fields are missing
        a1 = self._parse_a1_summary(text)
        bogus_sys = I.get("systemnummer")
        if (not bogus_sys) or len(str(bogus_sys))>12 or re.search(r"[A-Za-zÅÄÖåäö]", str(bogus_sys)):
            if a1.get("systemnr"): I["systemnummer"] = a1["systemnr"]
        elif "systemnummer" not in I and a1.get("systemnr"):
            I["systemnummer"] = a1["systemnr"]
        if "besiktningsdatum" not in I and a1.get("besiktningsdatum"):
            I["besiktningsdatum"] = a1["besiktningsdatum"]
        if "besiktningsresultat" not in I and a1.get("besiktningsresultat"):
            I["besiktningsresultat"] = a1["besiktningsresultat"]
        if "nästa_ordinarie_besiktning" not in I and a1.get("nästa_ordinarie_besiktning"):
            I["nästa_ordinarie_besiktning"] = a1["nästa_ordinarie_besiktning"]


        # Derive fastighetsbeteckning from adress if missing (pattern "Xxx Yyy 12:34 <street...>")
        if "fastighetsbeteckning" not in I and I.get("adress"):
            mfb = re.match(r"^\s*([A-Za-zÅÄÖåäö\- ]+\s+\d+:\d+)\s+(.+)$", I["adress"])
            if mfb:
                I["fastighetsbeteckning"] = mfb.group(1).strip()
                I["adress"] = mfb.group(2).strip()

        return I

    

    def _parse_a1_summary(self, text: str) -> dict:
        """
        Try to parse the A1 table summary row(s) for:
        - systemnr (first row)
        - besiktningsdatum (first row)
        - besiktningsresultat (G/U/Godkänd/Underkänd)
        - nästa ordinarie besiktning (first row)
        This is a robust fallback when INTYG block is minimal.
        """
        out = {}
        # A coarse regex that looks for rows like:
        # <sysnr> <internt> <beskat> <datum> <result> [<ombesiktdat>] <nästa_datum>
        # Make it permissive with many spaces and optional fields.
        row_re = re.compile(
            r"\n\s*(?P<sysnr>\d+)\s+(?P<i1>\d+)\s+(?P<i2>\d+)\s+"
            r"(?P<datum>\d{4}-\d{2}-\d{2})\s+"
            r"(?P<res>[GU]|Godkänd|Underkänd)\s+"
            r"(?:(?P<omb>\d{4}-\d{2}-\d{2})\s+)?"
            r"(?P<nasta>\d{4}-\d{2}-\d{2})",
            re.I
        )
        m = row_re.search(text)
        if m:
            out["systemnr"] = m.group("sysnr")
            out["besiktningsdatum"] = m.group("datum")
            res = m.group("res")
            out["besiktningsresultat"] = "Godkänd" if res.upper().startswith("G") else ("Underkänd" if res.upper().startswith("U") else res)
            out["nästa_ordinarie_besiktning"] = m.group("nasta")
        return out

    # ---------------- Table parsers ----------------
    def _parse_b1_tables(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for tbl in tables:
            if not tbl or not tbl[0]: 
                continue
            colmap = map_headers_to_keys(tbl[0], {
                "plats": HEADER_VARIANTS["plats"],
                "don_typ": HEADER_VARIANTS["don_typ"],
                "proj_ls": HEADER_VARIANTS["proj_ls"],
                "uppm_ls": HEADER_VARIANTS["uppm_ls"],
                "matmetod": HEADER_VARIANTS["matmetod"],
                "anm": HEADER_VARIANTS["anm"],
            })
            if "proj_ls" in colmap.values() and "uppm_ls" in colmap.values():
                for row in tbl[1:]:
                    if not any(row): 
                        continue
                    item = {}
                    for idx, key in colmap.items():
                        if idx < len(row):
                            val = (row[idx] or "").strip()
                            if key in {"proj_ls", "uppm_ls"}:
                                item[key] = as_number(val)
                            else:
                                item[key] = val
                    if "proj_ls" in item or "uppm_ls" in item:
                        results.append(item)
        return results

    def _parse_l1_tables(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for tbl in tables:
            if not tbl or not tbl[0]:
                continue
            colmap = map_headers_to_keys(tbl[0], {
                "rum": HEADER_VARIANTS["rum"],
                "tilluft_proj": HEADER_VARIANTS["tilluft_proj"],
                "tilluft_uppm": HEADER_VARIANTS["tilluft_uppm"],
                "franluft_proj": HEADER_VARIANTS["franluft_proj"],
                "franluft_uppm": HEADER_VARIANTS["franluft_uppm"],
            })
            if any(k in colmap.values() for k in ["tilluft_proj", "tilluft_uppm", "franluft_proj", "franluft_uppm"]):
                for row in tbl[1:]:
                    if not any(row):
                        continue
                    item = {"tilluft": {}, "franluft": {}}
                    for idx, key in colmap.items():
                        if idx >= len(row): 
                            continue
                        val = (row[idx] or "").strip()
                        if key == "rum":
                            item["rum"] = val
                        elif key == "tilluft_proj":
                            item["tilluft"]["proj_ls"] = as_number(val)
                        elif key == "tilluft_uppm":
                            item["tilluft"]["uppm_ls"] = as_number(val)
                        elif key == "franluft_proj":
                            item["franluft"]["proj_ls"] = as_number(val)
                        elif key == "franluft_uppm":
                            item["franluft"]["uppm_ls"] = as_number(val)
                    t = item["tilluft"].get("uppm_ls")
                    f = item["franluft"].get("uppm_ls")
                    if t is not None and f is not None:
                        item["balans_ls"] = round(t - f, 2)
                    results.append(item)
        return results

    def _parse_k1_tables(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for tbl in tables:
            if not tbl or not tbl[0]:
                continue
            colmap = map_headers_to_keys(tbl[0], {
                "rum": HEADER_VARIANTS["rum"],
                "temp_c": HEADER_VARIANTS["temp_c"],
                "co2_ppm": HEADER_VARIANTS["co2_ppm"],
                "drag": HEADER_VARIANTS["drag"]
            })
            if any(k in colmap.values() for k in ["temp_c", "co2_ppm"]):
                for row in tbl[1:]:
                    if not any(row):
                        continue
                    item = {}
                    for idx, key in colmap.items():
                        if idx >= len(row): 
                            continue
                        val = (row[idx] or "").strip()
                        if key == "temp_c":
                            item["inomhustemp_c"] = as_number(val)
                        elif key == "co2_ppm":
                            item["co2_ppm"] = as_number(val)
                        elif key == "drag":
                            item["drag"] = val
                        elif key == "rum":
                            item["benamning"] = val
                    results.append(item)
        return results

    def _parse_c1_tables(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for tbl in tables:
            if not tbl or not tbl[0]:
                continue
            colmap = map_headers_to_keys(tbl[0], {
                "anm": HEADER_VARIANTS["anm"],
                "klassning": HEADER_VARIANTS["klassning"]
            })
            if "anm" in colmap.values():
                for row in tbl[1:]:
                    if not any(row):
                        continue
                    item: Dict[str, Any] = {}
                    for idx, key in colmap.items():
                        if idx >= len(row):
                            continue
                        val = (row[idx] or "").strip()
                        if key == "klassning":
                            item["klassning"] = val
                        elif key == "anm":
                            item["anmärkning"] = val
                    if item:
                        results.append(item)
        return results

    def _parse_d1_tables(self, tables: List[List[List[str]]]) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for tbl in tables:
            if not tbl or not tbl[0]:
                continue
            colmap = map_headers_to_keys(tbl[0], {
                "atgard": HEADER_VARIANTS["atgard"],
                "ansvarig": HEADER_VARIANTS["ansvarig"],
                "deadline": HEADER_VARIANTS["deadline"],
                "status": HEADER_VARIANTS["status"]
            })
            if "atgard" in colmap.values():
                for row in tbl[1:]:
                    if not any(row):
                        continue
                    item: Dict[str, Any] = {}
                    for idx, key in colmap.items():
                        if idx >= len(row):
                            continue
                        val = (row[idx] or "").strip()
                        if key == "deadline":
                            val2 = val.replace("/", "-")
                            try:
                                if re.match(r"\d{2}-\d{2}-\d{4}", val2):
                                    val2 = datetime.strptime(val2, "%d-%m-%Y").date().isoformat()
                                elif re.match(r"\d{4}-\d{2}-\d{2}", val2):
                                    val2 = datetime.strptime(val2, "%Y-%m-%d").date().isoformat()
                            except Exception:
                                pass
                            item["deadline"] = val2
                        elif key == "atgard":
                            item["beskrivning"] = val
                        else:
                            item[key] = val
                    results.append(item)
        return results

if __name__ == "__main__":
    import sys, json
    if len(sys.argv) < 2:
        print("Usage: python ovk_extractor.py <path_to_ovk_pdf>")
        sys.exit(1)
    pdf_path = sys.argv[1]
    extractor = OVKProtokollExtractor()
    result = extractor.extract(pdf_path)
    print(json.dumps({
        "success": result.success,
        "warnings": result.warnings,
        "error": result.error,
        "data": result.data
    }, ensure_ascii=False, indent=2))
