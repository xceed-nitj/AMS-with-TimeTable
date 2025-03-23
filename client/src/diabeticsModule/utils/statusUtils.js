import {
  FiAlertCircle,
  FiActivity,
  FiCheckCircle,
  FiHelpCircle,
  FiUser,
} from 'react-icons/fi';

export const getStatusColor = (status) => {
  switch (status) {
    case 'danger':
      return 'red.500';
    case 'warning':
      return 'orange.500';
    case 'normal':
      return 'green.500';
    case 'unknown':
      return 'gray.500';
    default:
      return 'gray.500';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'danger':
      return FiAlertCircle;
    case 'warning':
      return FiActivity;
    case 'normal':
      return FiCheckCircle;
    case 'unknown':
      return FiHelpCircle;
    default:
      return FiUser;
  }
};
