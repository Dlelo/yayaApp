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

}


interface UserDetails {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  houseHelp: HouseHelp;
  homeOwner: HomeOwner;
  subscription: {
    plan: string;
    active: boolean;
    expiry: string;
  };
  active:boolean;
}
