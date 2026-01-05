interface HouseHelp {
  active:boolean;
  id: number;
  contactPersons: string;
  currentLocation: string;
  goodConduct: string;
  homeLocation: string;
  languages: string[];
  levelOfEducation: string;
  medicalReport: string;
  nationalId: string;
  numberOfChildren: string;
  religion: string;
  skills: string[];
  yearsOfExperience: number;
  nationalIdDocument:string;
  user:UserDetails;
  houseHelpType:[];
  age:string;
  weight:string;
  height:string;
}

interface HomeOwner {
  active:boolean;
  id: number;
  homeLocation: string;
  houseType: string;
  numberOfRooms: string;
  numberOfDependents: string;
  nationalIdDocument: string;

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
}
