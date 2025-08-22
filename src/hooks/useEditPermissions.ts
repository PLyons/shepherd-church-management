import { useMemo } from 'react';
import { useAuth } from '../contexts/FirebaseAuthContext';

export function useEditPermissions(memberId: string) {
  const { member: currentUser } = useAuth();

  return useMemo(() => {
    if (!currentUser) {
      return {
        canEditBasicInfo: false,
        canEditRole: false,
        canEditStatus: false,
        canEditChurchInfo: false,
        canEditContactInfo: false,
        canEditPersonalInfo: false,
      };
    }

    const isAdmin = currentUser.role === 'admin';
    const isPastor = currentUser.role === 'pastor';
    const isOwnProfile = currentUser.id === memberId;

    return {
      canEditBasicInfo: isAdmin || isPastor || isOwnProfile,
      canEditRole: isAdmin,
      canEditStatus: isAdmin || isPastor,
      canEditChurchInfo: isAdmin || isPastor,
      canEditContactInfo: isAdmin || isPastor || isOwnProfile,
      canEditPersonalInfo: isAdmin || isPastor || isOwnProfile,
    };
  }, [currentUser, memberId]);
}
