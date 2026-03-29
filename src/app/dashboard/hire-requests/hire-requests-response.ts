interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface HomeOwnerRef {
  id: number;
  user: User;
}

interface HireRequest {
  id: number;
  homeOwner: HomeOwnerRef;
  houseHelp: User;
  createdAt: string;
  status: string;
  paid: boolean;
}
