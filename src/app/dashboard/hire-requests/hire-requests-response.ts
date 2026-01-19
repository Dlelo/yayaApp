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
  owner: User;
  househelp: User;
  date: Date;
}
