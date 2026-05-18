import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

/**
 * Reusable hook for admin authentication
 * Returns isAdmin and isLoading states
 * Redirects to login if not authenticated or not admin
 */
export function useAdminAuth() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setIsAdmin(false);
          setIsLoading(false);
          navigate('/admin/login');
          return;
        }

        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError || !roleData) {
          setIsAdmin(false);
          toast.error('Unauthorized access');
          navigate('/admin/login');
        } else {
          setIsAdmin(true);
        }
      } catch (error) {
        logger.error('Auth check error:', error);
        setIsAdmin(false);
        navigate('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  return { isAdmin, isLoading };
}
