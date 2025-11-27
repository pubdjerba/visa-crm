
import { ApplicationStatus, Client, VisaType, VisaRequirement, AppSettings, ExternalResource, LetterTemplate, OpeningLog } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  agencyName: 'VisaFlow Agency',
  currency: 'TND',
  darkMode: false,
  visaTypes: [
    'Tourisme',
    'Affaires',
    'Études',
    'Regroupement Familial',
    'Parent d\'un français',
    'Conjoint',
    'Visa de retour',
    'Visa Talon'
  ],
  destinations: [
    'France',
    'Allemagne',
    'Italie',
    'Espagne',
    'Belgique',
    'Portugal',
    'Suisse',
    'Canada',
    'USA'
  ],
  menuOrder: [
    'dashboard',
    'analytics',
    'kanban',
    'clients',
    'appointment-tracker',
    'tasks',
    'templates',
    'requirements',
    'resources',
    'calendar',
    'archives',
    'settings'
  ],
  appPassword: '1234', // Default PIN
  centers: [
    { name: 'TLSContact Tunis', url: 'https://visas-fr.tlscontact.com/visa/tn/tnTUN2fr/home' },
    { name: 'TLSContact Sfax', url: 'https://visas-fr.tlscontact.com/visa/tn/tnSFA2fr/home' },
    { name: 'VFS Global', url: 'https://visa.vfsglobal.com/tun/fr/deu/login' },
    { name: 'BLS International', url: 'https://tunisia.blsspainvisa.com/french/index.php' },
    { name: 'Almaviva', url: 'https://av-services.com/' }
  ]
};

// Base64 encoded sound "Glass Ping" for notifications
export const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU";

// Short pleasant beep sound (Base64)
export const ALERT_SOUND_B64 = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG840016BXCMACAmA6D2OGzFManFqSX5oRd45wDLj3/i03J8xK980smh5yfP9//36xT///3/n/4M//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG840016BXCMACAmA6D2OGzFManFqSX5oRd45wDLj3/i03J8xK980smh5yfP9//36xT///3/n/4M";

export const CHECK_FREQUENCIES = {
  URGENT: 30, // Minutes (30 min)
  NORMAL: 120, // Minutes (2 hours)
  LOW: 1440 // Minutes (24 hours - 1 time per day)
};

export const INITIAL_OPENING_LOGS: OpeningLog[] = [
  { id: '1', destination: 'France', center: 'TLSContact Tunis', visaType: 'Tourisme', foundAt: '2023-10-10T09:15:00', dayOfWeek: 'Mardi', timeOfDay: '09:15' },
  { id: '2', destination: 'France', center: 'TLSContact Tunis', visaType: 'Tourisme', foundAt: '2023-10-12T14:30:00', dayOfWeek: 'Jeudi', timeOfDay: '14:30' },
  { id: '3', destination: 'Allemagne', center: 'VFS Global', visaType: 'Affaires', foundAt: '2023-10-13T08:00:00', dayOfWeek: 'Vendredi', timeOfDay: '08:00' },
];

export const INITIAL_TEMPLATES: LetterTemplate[] = [
  {
    id: 'tpl_1',
    name: 'Engagement de Retour',
    content: `Je soussigné(e), {{nom}}, né(e) le [DATE_NAISSANCE] à [LIEU], titulaire du passeport n°{{passeport}},

Déclare sur l'honneur m'engager à quitter le territoire de l'espace Schengen avant l'expiration de mon visa.

Je suis conscient(e) que tout dépassement de la durée de séjour autorisée m'exposera à des sanctions et compromettra mes futures demandes de visa.

Fait à Tunis, le [DATE]

Signature :
`
  },
  {
    id: 'tpl_2',
    name: 'Lettre Explicative (Tourisme)',
    content: `À l'attention de Monsieur le Consul,

Objet : Demande de visa touristique pour {{destination}}

Monsieur le Consul,

J'ai l'honneur de solliciter votre bienveillance pour l'octroi d'un visa de court séjour touristique pour visiter {{destination}}.

Je compte voyager du [DATE_DEBUT] au [DATE_FIN].

Vous trouverez ci-joint tous les documents justifiant ma situation socioprofessionnelle ainsi que mes moyens de subsistance.

Je vous prie d'agréer, Monsieur le Consul, l'expression de mes salutations distinguées.

{{nom}}
Tél : {{telephone}}`
  }
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    fullName: 'Ahmed Ben Salah',
    passportNumber: 'X12345678',
    passportExpiry: '2028-05-12',
    phone: '+216 20 123 456',
    email: 'ahmed.bs@example.com',
    address: '12 Rue de la Liberté, Tunis',
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    notes: 'Client VIP, voyage souvent pour affaires.',
    applications: [
      {
        id: 'app_1',
        destination: 'France',
        center: 'TLSContact Tunis',
        visaType: VisaType.TOURISM,
        status: ApplicationStatus.WAITING_APPOINTMENT,
        archived: false,
        appointmentConfig: {
          portalLogin: 'ahmed.bs@gmail.com',
          portalPassword: 'Password123!',
          targetDateStart: '2023-11-01',
          targetDateEnd: '2023-11-15',
          lastChecked: '2023-10-25 10:30',
          priorityMode: 'auto'
        },
        price: 450,
        deposit: 200,
        documents: [
          { id: 'd1', name: 'Passeport.pdf', type: 'Passeport', uploadDate: '2023-10-01', status: 'valid' },
          { id: 'd2', name: 'Reservation_Hotel.pdf', type: 'Hôtel', uploadDate: '2023-10-02', status: 'valid' },
        ],
        members: []
      }
    ],
    history: [
      { id: 'h1', date: '2023-10-01', type: 'call', notes: 'Premier contact, explication procédure.' },
      { id: 'h2', date: '2023-10-05', type: 'whatsapp', notes: 'Envoi de la liste des documents.' }
    ]
  },
  {
    id: '2',
    fullName: 'Leila Trabelsi',
    passportNumber: 'Y87654321',
    passportExpiry: '2025-12-30',
    phone: '+216 98 765 432',
    email: 'leila.tr@example.com',
    address: 'Avenue Hedi Chaker, Sfax',
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    notes: '',
    applications: [
      {
        id: 'app_2',
        destination: 'France',
        center: 'TLSContact Sfax',
        visaType: VisaType.STUDY,
        status: ApplicationStatus.DOCS_PENDING,
        archived: false,
        price: 600,
        deposit: 0,
        documents: [
          { id: 'd3', name: 'Pre-inscription.pdf', type: 'Études', uploadDate: '2023-10-10', status: 'valid' }
        ],
        members: []
      }
    ],
    history: []
  },
  {
    id: '3',
    fullName: 'Famille Mansour',
    // Pas de passeport renseigné pour test
    phone: '+216 50 111 222',
    email: 'karim.m@example.com',
    address: 'Sousse',
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    notes: 'Urgent, doit partir avant le 1er novembre.',
    applications: [
      {
        id: 'app_3',
        destination: 'Allemagne',
        center: 'VFS Global',
        visaType: VisaType.TOURISM,
        status: ApplicationStatus.SUBMITTED,
        archived: false,
        submissionDate: '2023-10-20',
        price: 1500,
        deposit: 1000,
        documents: [],
        members: [
          { id: 'm1', fullName: 'Sonia Mansour', relation: 'Conjoint(e)' },
          { id: 'm2', fullName: 'Youssef Mansour', relation: 'Enfant' }
        ]
      }
    ],
    history: []
  },
  {
    id: '4',
    fullName: 'Sarra Jridi',
    passportNumber: 'K99887766',
    passportExpiry: '2030-01-15',
    phone: '+216 25 555 666',
    email: 'sarra.j@example.com',
    address: 'Bizerte',
    avatarUrl: 'https://picsum.photos/200/200?random=4',
    notes: '',
    applications: [
      {
        id: 'app_4',
        destination: 'Italie',
        center: 'Almaviva',
        visaType: VisaType.FAMILY,
        status: ApplicationStatus.WAITING_APPOINTMENT,
        archived: false,
        appointmentConfig: {
          portalLogin: 'sarra.jridi',
          portalPassword: 'MySecurePassword',
          priorityMode: 'urgent'
        },
        submissionDate: '2023-09-15',
        price: 300,
        deposit: 150,
        documents: [],
        members: []
      }
    ],
    history: []
  }
];

export const INITIAL_REQUIREMENTS: VisaRequirement[] = [
  {
    id: 'req_1',
    visaType: VisaType.TOURISM,
    content: [
      'Passeport valide (plus de 3 mois après le retour).',
      '2 Photos d\'identité récentes (fond blanc).',
      'Assurance voyage (couverture min 30.000€).',
      'Réservation d\'hôtel confirmée.',
      'Billet d\'avion A/R.',
      'Relevés bancaires des 3 derniers mois.',
      'Attestation de travail ou Patente.'
    ]
  },
  {
    id: 'req_2',
    visaType: VisaType.BUSINESS,
    content: [
      'Lettre d\'invitation de la société partenaire.',
      'Ordre de mission de la société tunisienne.',
      'Preuve de relations commerciales (factures, emails).',
      'Relevés bancaires de la société.'
    ]
  },
  {
    id: 'req_3',
    visaType: VisaType.SPOUSE,
    content: [
      'Acte de mariage transcrit (moins de 3 mois).',
      'Copie intégrale de l\'acte de naissance.',
      'Preuve de la nationalité française du conjoint.',
      'Justificatif de domicile du conjoint en France.'
    ]
  }
];

export const INITIAL_RESOURCES: ExternalResource[] = [
  {
    id: 'res_1',
    title: 'TLSContact France',
    website: 'https://fr.tlscontact.com/tn/tun/index.php',
    phone: '+216 71 169 200',
    category: 'Rendez-vous',
    description: 'Portail officiel pour les RDV Visa France (Tunis & Sfax).'
  },
  {
    id: 'res_2',
    title: 'France-Visas',
    website: 'https://france-visas.gouv.fr/',
    category: 'Formulaire',
    description: 'Site officiel pour remplir les formulaires de demande.'
  },
  {
    id: 'res_3',
    title: 'VFS Global',
    website: 'https://visa.vfsglobal.com/tun/fr/aut',
    phone: '+216 70 145 757',
    category: 'Rendez-vous',
    description: 'Centre pour Autriche, et autres pays Schengen.'
  },
  {
    id: 'res_6',
    title: 'Consulat Général de France',
    phone: '+216 31 315 000',
    category: 'Ambassade',
    description: 'Standard Consulat Général de France à Tunis.'
  },
  {
    id: 'res_7',
    title: 'BLS International (Espagne)',
    website: 'https://tunisia.blsspainvisa.com/french/index.php',
    category: 'Rendez-vous',
    description: 'Centre de demande de visa pour l\'Espagne.'
  }
];
