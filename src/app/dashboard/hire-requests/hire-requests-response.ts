interface HireRequest {
  id: number;
  createdAt: Date;
  paid: boolean;
  homeOwner: {
    id: number;
    name: string;
  };
  houseHelp: {
    id: number;
    name: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  startDate: Date;
  message: string;
}