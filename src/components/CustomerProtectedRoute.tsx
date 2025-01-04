import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const CustomerProtectedRoute: React.FC<Props> = ({ children }) => {
  // For now, always render children since we're removing auth
  return <>{children}</>;
};

export default CustomerProtectedRoute;
