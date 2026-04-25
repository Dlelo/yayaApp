interface GeoLocation {
  latitude: number;
  longitude: number;
  placeName?: string;
  addressLine?: string;
}

interface HouseHelp {
  active:boolean;
  id: number;
  contactPersons: string;
  currentLocation: string;
  goodConduct: string;
  homeLocation: string;
  languages: string[];
  levelOfEducation: string;
  medicalReport: string | null;
  nationalId: string;
  numberOfChildren: string;
  religion: string;
  skills: string[];
  yearsOfExperience: number;
  nationalIdDocument:string;
  user:UserDetails;
  houseHelpType?:string[];
  age:string;
  weight:string;
  height:string;
  securityCleared:boolean;
  securityClearanceComments:string;
  profilePictureDocument:string;
  contactPersonsPhoneNumber:string;
  pinLocation?: GeoLocation;
  additionalDocuments?: string[];
  currentCounty?: string;
  homeCounty?: string;
  availability?: string;
  experienceSummary?: string;
  preferences?: HouseHelpPreferences;
  lastModifiedBy?: number | null;
  lastModifiedAt?: string | null;
}

interface HouseHelpPreferences {
  houseHelpType?: string | string[] | null;
  minExperience?: number | null;
  preferredLocation?: string;
  preferredSkills?: string[];
  preferredLanguages?: string[];
  preferredChildAgeRanges?: (string | number)[];
  preferredMaxChildren?: number | null;
  preferredServices?: string[];
  preferredReligion?: string;
  okayWithPets?: boolean;
  minSalary?: number | null;
  maxSalary?: number | null;
}

interface HomeOwner {
  active:boolean;
  id: number;
  homeLocation: string;
  houseType: string;
  numberOfRooms: string;
  numberOfDependents: string;
  nationalIdDocument: string;
  user:UserDetails;
  securityCleared:boolean;
  securityClearanceComments:string;
  profilePictureDocument: string;
  pinLocation?: GeoLocation;
  additionalDocuments?: string[];
  nationalId?: string;
  preferences?: HomeOwnerPreferences;
  lastModifiedBy?: number | null;
  lastModifiedAt?: string | null;
}

interface HomeOwnerPreferences {
  houseHelpType?: string | string[] | null;
  minExperience?: number | null;
  location?: string;
  preferredSkills?: string[];
  preferredLanguages?: string[];
  minMatchScore?: number | null;
  childrenAgeRanges?: (string | number)[];
  numberOfChildren?: number | null;
  requiredServices?: string[];
  hasPets?: boolean;
  religionPreference?: string;
  requiresSecurityCleared?: boolean;
  preferredMaxAge?: number | null;
  preferredMinAge?: number | null;
  minSalary?: number | null;
  maxSalary?: number | null;
}

interface AgentProfile {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  locationOfOperation: string;
  homeLocation: string;
  houseNumber: string;
  verified: boolean;
}

interface UserDetails {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  houseHelp: HouseHelp;
  homeOwner: HomeOwner;
  agentProfile?: AgentProfile;
  subscription: {
    plan: string;
    active: boolean;
    expiry: string;
  };
  active:boolean;
  createdById?: number;
  createdByName?: string;
}

interface HireRequest {
  id: number;
  homeOwnerId: number;
  homeOwnerName?: string;
  homeOwnerUserId?: number;
  houseHelpId: number;
  houseHelpName?: string;
  status: string;
  createdAt?: string;
  startDate?: string;
  message?: string;
}

interface AgentHireRequest {
  id: number;
  houseHelpName?: string;
  houseHelpUserId?: number;
  homeOwnerName?: string;
  homeOwnerUserId?: number;
  homeOwnerId?: number;
  status: string;
  createdAt?: string;
  startDate?: string;
  commissionEarned: number;
}

interface AgentHouseHelp {
  id: number;
  userId: number;
  name: string;
  phone?: string;
  verified: boolean;
  active: boolean;
  hiringStatus?: string;
}

interface WithdrawalRequest {
  id: number;
  amount: number;
  status: string;
  requestedAt?: string;
  processedAt?: string;
  mpesaPhone?: string;
  notes?: string;
}

interface AgentEarnings {
  agentId: number;
  totalHires: number;
  totalEarned: number;
  totalWithdrawn: number;
  balanceRemaining: number;
  hireRequests: AgentHireRequest[];
  withdrawals: WithdrawalRequest[];
}

interface PaymentRecord {
  id: number;
  transactionId: string;
  amount: number;
  provider: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  createdAt?: string;
  userId?: number;
  userEmail?: string;
  userName?: string;
  baseFee?: number;
  surchargeFee?: number;
  surchargeReason?: string;
  archived?: boolean;
}
