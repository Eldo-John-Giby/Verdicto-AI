"""
Legal Document Generator for LexAI
==================================

Quick MVP for hackathon demo
Generates bail applications, FIR drafts, and legal notices
"""

from typing import Dict, Any, Optional
from datetime import datetime
import json

class LegalDocumentGenerator:
    """
    Generate legal documents from templates with AI assistance
    """
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, str]:
        """Load document templates"""
        return {
            'bail_application': """
IN THE COURT OF {court_name}

CRIMINAL MISCELLANEOUS APPLICATION NO. _______

IN THE MATTER OF:
{applicant_name} ... Applicant
(Through Advocate: {advocate_name})

VERSUS

STATE OF {state} ... Respondent

APPLICATION FOR BAIL UNDER SECTION {section}

RESPECTFULLY SHOWETH:

1. That the applicant is an accused in FIR No. {fir_number} dated {fir_date} registered at Police Station {police_station} under Sections {charges} of the Indian Penal Code.

2. That the applicant was arrested on {arrest_date} and has been in judicial custody since then.

3. That the applicant is {age} years old, a resident of {address}, and is {occupation} by profession.

4. That the applicant is {family_status} and is the sole bread earner of the family.

5. That the applicant has deep roots in the community and has no criminal antecedents.

6. GROUNDS FOR BAIL:

{grounds}

7. That the applicant undertakes to:
   a) Appear before the Court as and when required
   b) Not tamper with evidence or influence witnesses
   c) Not commit any offense while on bail
   d) Furnish personal or surety bond as required

8. That the applicant is willing to comply with any conditions that this Hon'ble Court may deem fit to impose.

PRAYER:

In view of the above, it is most respectfully prayed that this Hon'ble Court may be pleased to:

a) Grant bail to the applicant
b) Pass any other order as deemed fit in the interest of justice

Place: {place}
Date: {date}

                                        (Advocate for Applicant)
""",

            'fir_complaint': """
FIRST INFORMATION REPORT (FIR)

Police Station: {police_station}
District: {district}
Date: {date}
Time: {time}

COMPLAINANT DETAILS:
Name: {complainant_name}
Father's/Husband's Name: {father_husband_name}
Address: {address}
Contact Number: {phone}
Email: {email}

ACCUSED DETAILS:
{accused_details}

DETAILS OF INCIDENT:

1. Date and Time of Incident: {incident_date} at approximately {incident_time}

2. Place of Incident: {incident_place}

3. Description of Incident:

{incident_description}

4. Details of Loss/Injury (if any):

{loss_details}

5. Witnesses (if any):

{witnesses}

6. Evidence Available:

{evidence}

7. Sections Applicable:

Based on the facts narrated above, it appears that offenses under the following sections have been committed:
{sections_applicable}

8. I hereby declare that the above information is true to the best of my knowledge and belief.

Signature of Complainant: _______________
Name: {complainant_name}
Date: {date}

[For Official Use Only]
FIR No.: _____________
Registered under Sections: _____________
Investigating Officer: _____________
""",

            'legal_notice': """
LEGAL NOTICE

To,
{recipient_name}
{recipient_address}

Date: {date}

Dear Sir/Madam,

SUBJECT: LEGAL NOTICE UNDER {act_section}

Under instructions from and on behalf of my client, {client_name}, residing at {client_address}, I hereby serve you with this legal notice for the following reasons:

1. FACTS OF THE CASE:

{case_facts}

2. CAUSE OF ACTION:

{cause_of_action}

3. LEGAL GROUNDS:

The acts/omissions on your part constitute violations under:
{legal_grounds}

4. RELIEF SOUGHT:

My client demands that you:

{relief_demanded}

5. NOTICE PERIOD:

You are hereby called upon to comply with the above demands within 15 days from the date of receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you at your risk as to costs and consequences.

This notice is without prejudice to the rights and contentions of my client.

Yours faithfully,

{advocate_name}
Advocate for {client_name}
Address: {advocate_address}
Contact: {advocate_contact}
""",

            'petition': """
IN THE {court_name}

{petition_type} PETITION NO. _______

IN THE MATTER OF:

{petitioner_name}
{petitioner_address}
... Petitioner

VERSUS

{respondent_name}
{respondent_address}
... Respondent

PETITION UNDER {under_section}

TO,
THE HON'BLE {judge_title}

THE HUMBLE PETITION OF THE PETITIONER ABOVE-NAMED

MOST RESPECTFULLY SHOWETH:

1. PARTIES:

{parties_description}

2. FACTS:

{facts}

3. CAUSE OF ACTION:

{cause_of_action}

4. GROUNDS:

{grounds}

5. RELIEF:

WHEREFORE, in the light of the facts and circumstances stated above, it is most respectfully prayed that this Hon'ble Court may be pleased to:

{relief_prayed}

And pass such other and further orders as this Hon'ble Court may deem fit and proper in the interest of justice.

Place: {place}
Date: {date}

                                        PETITIONER/ADVOCATE
"""
        }
    
    def generate_bail_application(self, details: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate bail application
        
        Args:
            details: Dict containing applicant details, charges, grounds, etc.
        """
        template = self.templates['bail_application']
        
        # Set defaults
        doc_details = {
            'court_name': details.get('court_name', 'SESSIONS JUDGE'),
            'applicant_name': details.get('applicant_name', '[APPLICANT NAME]'),
            'advocate_name': details.get('advocate_name', '[ADVOCATE NAME]'),
            'state': details.get('state', '[STATE]'),
            'section': details.get('section', '439 Cr.P.C.'),
            'fir_number': details.get('fir_number', '[FIR NO.]'),
            'fir_date': details.get('fir_date', '[DATE]'),
            'police_station': details.get('police_station', '[POLICE STATION]'),
            'charges': details.get('charges', '[IPC SECTIONS]'),
            'arrest_date': details.get('arrest_date', '[ARREST DATE]'),
            'age': details.get('age', '[AGE]'),
            'address': details.get('address', '[ADDRESS]'),
            'occupation': details.get('occupation', 'engaged in lawful occupation'),
            'family_status': details.get('family_status', 'having family responsibilities'),
            'grounds': self._generate_bail_grounds(details),
            'place': details.get('place', '[PLACE]'),
            'date': details.get('date', datetime.now().strftime('%d.%m.%Y')),
        }
        
        document = template.format(**doc_details)
        
        return {
            'document_type': 'bail_application',
            'content': document,
            'generated_at': datetime.now().isoformat(),
            'editable': True,
            'format': 'text/plain'
        }
    
    def _generate_bail_grounds(self, details: Dict[str, Any]) -> str:
        """Auto-generate bail grounds based on details"""
        grounds = []
        
        if details.get('first_time_offender', True):
            grounds.append("a) The applicant is a first-time offender with no criminal antecedents.")
        
        if details.get('cooperating', True):
            grounds.append("b) The applicant has been fully cooperating with the investigation.")
        
        if details.get('weak_evidence', False):
            grounds.append("c) The evidence against the applicant is weak and based on circumstantial factors.")
        
        if details.get('no_flight_risk', True):
            grounds.append("d) The applicant has deep roots in the community and there is no risk of absconding.")
        
        if details.get('medical_grounds', False):
            grounds.append("e) The applicant requires medical attention which cannot be adequately provided in custody.")
        
        grounds.append("f) The applicant's continued detention is not necessary for the purpose of investigation.")
        grounds.append("g) The applicant is willing to abide by any conditions imposed by this Hon'ble Court.")
        
        return '\n   '.join(grounds)
    
    def generate_fir(self, details: Dict[str, Any]) -> Dict[str, str]:
        """Generate FIR/Complaint"""
        template = self.templates['fir_complaint']
        
        doc_details = {
            'police_station': details.get('police_station', '[POLICE STATION]'),
            'district': details.get('district', '[DISTRICT]'),
            'date': details.get('date', datetime.now().strftime('%d.%m.%Y')),
            'time': details.get('time', datetime.now().strftime('%H:%M')),
            'complainant_name': details.get('complainant_name', '[NAME]'),
            'father_husband_name': details.get('father_husband_name', '[FATHER/HUSBAND NAME]'),
            'address': details.get('address', '[ADDRESS]'),
            'phone': details.get('phone', '[PHONE]'),
            'email': details.get('email', '[EMAIL]'),
            'accused_details': details.get('accused_details', '[ACCUSED DETAILS]'),
            'incident_date': details.get('incident_date', '[DATE]'),
            'incident_time': details.get('incident_time', '[TIME]'),
            'incident_place': details.get('incident_place', '[PLACE]'),
            'incident_description': details.get('incident_description', '[DESCRIPTION OF INCIDENT]'),
            'loss_details': details.get('loss_details', 'N/A'),
            'witnesses': details.get('witnesses', 'None'),
            'evidence': details.get('evidence', 'As per investigation'),
            'sections_applicable': details.get('sections_applicable', '[IPC SECTIONS]'),
        }
        
        document = template.format(**doc_details)
        
        return {
            'document_type': 'fir_complaint',
            'content': document,
            'generated_at': datetime.now().isoformat(),
            'editable': True,
            'format': 'text/plain'
        }
    
    def generate_legal_notice(self, details: Dict[str, Any]) -> Dict[str, str]:
        """Generate legal notice"""
        template = self.templates['legal_notice']
        
        doc_details = {
            'date': details.get('date', datetime.now().strftime('%d.%m.%Y')),
            'recipient_name': details.get('recipient_name', '[RECIPIENT NAME]'),
            'recipient_address': details.get('recipient_address', '[RECIPIENT ADDRESS]'),
            'act_section': details.get('act_section', 'RELEVANT PROVISIONS'),
            'client_name': details.get('client_name', '[CLIENT NAME]'),
            'client_address': details.get('client_address', '[CLIENT ADDRESS]'),
            'case_facts': details.get('case_facts', '[FACTS OF THE CASE]'),
            'cause_of_action': details.get('cause_of_action', '[CAUSE OF ACTION]'),
            'legal_grounds': details.get('legal_grounds', '[LEGAL VIOLATIONS]'),
            'relief_demanded': details.get('relief_demanded', '[RELIEF SOUGHT]'),
            'advocate_name': details.get('advocate_name', '[ADVOCATE NAME]'),
            'advocate_address': details.get('advocate_address', '[ADVOCATE ADDRESS]'),
            'advocate_contact': details.get('advocate_contact', '[CONTACT]'),
        }
        
        document = template.format(**doc_details)
        
        return {
            'document_type': 'legal_notice',
            'content': document,
            'generated_at': datetime.now().isoformat(),
            'editable': True,
            'format': 'text/plain'
        }
    
    def generate_petition(self, details: Dict[str, Any]) -> Dict[str, str]:
        """Generate petition"""
        template = self.templates['petition']
        
        doc_details = {
            'court_name': details.get('court_name', 'HIGH COURT OF [STATE]'),
            'petition_type': details.get('petition_type', 'WRIT'),
            'petitioner_name': details.get('petitioner_name', '[PETITIONER]'),
            'petitioner_address': details.get('petitioner_address', '[ADDRESS]'),
            'respondent_name': details.get('respondent_name', '[RESPONDENT]'),
            'respondent_address': details.get('respondent_address', '[ADDRESS]'),
            'under_section': details.get('under_section', 'ARTICLE 226 OF THE CONSTITUTION'),
            'judge_title': details.get('judge_title', 'CHIEF JUSTICE AND HIS COMPANION JUDGES'),
            'parties_description': details.get('parties_description', '[PARTY DETAILS]'),
            'facts': details.get('facts', '[FACTS]'),
            'cause_of_action': details.get('cause_of_action', '[CAUSE OF ACTION]'),
            'grounds': details.get('grounds', '[GROUNDS]'),
            'relief_prayed': details.get('relief_prayed', '[RELIEF PRAYED]'),
            'place': details.get('place', '[PLACE]'),
            'date': details.get('date', datetime.now().strftime('%d.%m.%Y')),
        }
        
        document = template.format(**doc_details)
        
        return {
            'document_type': 'petition',
            'content': document,
            'generated_at': datetime.now().isoformat(),
            'editable': True,
            'format': 'text/plain'
        }
    
    def get_template_list(self) -> list:
        """Get list of available templates"""
        return [
            {
                'id': 'bail_application',
                'name': 'Bail Application',
                'description': 'Application for bail under CrPC Section 439',
                'category': 'Criminal'
            },
            {
                'id': 'fir_complaint',
                'name': 'FIR / Complaint',
                'description': 'First Information Report for filing with police',
                'category': 'Criminal'
            },
            {
                'id': 'legal_notice',
                'name': 'Legal Notice',
                'description': 'Legal notice under relevant provisions',
                'category': 'General'
            },
            {
                'id': 'petition',
                'name': 'Petition',
                'description': 'Writ petition or other court petition',
                'category': 'Civil/Writ'
            }
        ]


# Global instance
_doc_generator = None

def get_document_generator() -> LegalDocumentGenerator:
    """Get or create document generator instance"""
    global _doc_generator
    if _doc_generator is None:
        _doc_generator = LegalDocumentGenerator()
    return _doc_generator


# Test
if __name__ == "__main__":
    generator = LegalDocumentGenerator()
    
    # Test bail application
    print("Generating bail application...")
    bail_details = {
        'applicant_name': 'Rajesh Kumar',
        'advocate_name': 'Adv. Priya Sharma',
        'state': 'Delhi',
        'fir_number': '123/2024',
        'fir_date': '15.01.2024',
        'police_station': 'Connaught Place',
        'charges': '420, 468 IPC',
        'arrest_date': '16.01.2024',
        'age': '35',
        'address': '123, New Delhi',
        'first_time_offender': True,
        'no_flight_risk': True,
    }
    
    result = generator.generate_bail_application(bail_details)
    print(result['content'][:500] + "...")
    print(f"\nDocument type: {result['document_type']}")
    print(f"Generated at: {result['generated_at']}")

