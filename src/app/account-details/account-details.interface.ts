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
