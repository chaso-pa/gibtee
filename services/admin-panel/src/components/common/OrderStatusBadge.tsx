import type React from 'react';
import { Badge } from '@chakra-ui/react';
import type { OrderStatus } from '../../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    pending: {
      colorScheme: 'gray',
      label: '処理待ち'
    },
    paid: {
      colorScheme: 'green',
      label: '支払済み'
    },
    processing: {
      colorScheme: 'blue',
      label: '処理中'
    },
    printing: {
      colorScheme: 'purple',
      label: '印刷中'
    },
    shipped: {
      colorScheme: 'orange',
      label: '発送済み'
    },
    delivered: {
      colorScheme: 'teal',
      label: '配送完了'
    },
    cancelled: {
      colorScheme: 'red',
      label: 'キャンセル'
    }
  };

  const config = statusConfig[status] || {
    colorScheme: 'gray',
    label: status
  };

  return (
    <Badge colorScheme={config.colorScheme} px={2} py={1} borderRadius='md'>
      {config.label}
    </Badge>
  );
};
