interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface HireRequest {
  id: number;
  status: string;
  paid: boolean;
  createdAt?: string;
  houseHelp: {
    id: number;
    name: string;
  };
  homeOwner: {
    id: number;
    user: {
      id: number;
      name: string;
    };
  };
}
