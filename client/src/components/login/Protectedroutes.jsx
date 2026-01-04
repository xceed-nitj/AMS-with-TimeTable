import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import getEnvironment from '../../getenvironment';

const ProtectedRoutes = ({ children }) => {
  const location = useLocation();
  const apiUrl = getEnvironment();

  const [loading, setLoading] = useState(true);
  const [exemptedLinks, setExemptedLinks] = useState([]);

  const isLoggedIn = !!localStorage.getItem('user');

  useEffect(() => {
    const fetchExemptedLinks = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/platform/get-exempted-links`
        );
        setExemptedLinks(res.data || []);
      } catch (err) {
        console.error('Failed to fetch exempted links', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExemptedLinks();
  }, [apiUrl]);

  if (loading) return null;

  const pathname = location.pathname;

  const isExempted = exemptedLinks.some((link) => {
    const normalizedLink = `/${link}`.replace(/\/+/g, '/');
    return (
      pathname === normalizedLink ||
      pathname.startsWith(`${normalizedLink}/`)
    );
  });

  if (isExempted) {
    return children;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoutes;
