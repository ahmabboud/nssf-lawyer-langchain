interface UserSubscription {
    isPro: boolean;
    isAdmin: boolean;
  }
  
  // Simple implementation without Clerk
  export const getUserSubscription = async (): Promise<UserSubscription> => {
    // Replace with your actual auth logic if needed
    return {
      isPro: true,  // Default to true for now
      isAdmin: false
    };
  };