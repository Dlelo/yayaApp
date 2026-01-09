interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  roles:[{
    name:string
  }];
}
