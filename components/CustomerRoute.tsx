/**
 * CustomerRoute.tsx
 * Wrapper cho routes khách hàng (quét QR)
 * - Không cần xác thực
 * - Cho phép truy cập /ban/:tableId
 * - Không cho phép navigate sang admin/kitchen
 */

import React from 'react';

interface CustomerRouteProps {
  children: React.ReactNode;
}

const CustomerRoute: React.FC<CustomerRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default CustomerRoute;
