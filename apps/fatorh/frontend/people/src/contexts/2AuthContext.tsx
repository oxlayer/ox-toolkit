import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { usePostHog } from "posthog-js/react";

// API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_BASE_URL;

// Kullanıcı tipi tanımlıyoruz
type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  isAdmin: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signOut: () => void;
  updateToken: (newToken: string) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const posthog = usePostHog();

  // Kullanıcı bilgilerini token ile almak için fonksiyon - useCallback ile memo edildi
  const fetchUserProfile = useCallback(async (authToken: string, signal?: AbortSignal) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        signal,
      });

      if (response.ok) {
        const userData = await response.json();
        return { success: true, data: userData };
      }

      // 401 Unauthorized - token geçersiz
      if (response.status === 401) {
        return { success: false, unauthorized: true, data: null };
      }

      // Diğer hatalar - retry yapılabilir
      return { success: false, unauthorized: false, data: null };
    } catch (error) {
      // AbortError - request iptal edildi, ignore et
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, unauthorized: false, data: null };
      }

      console.error("Error fetching user profile:", error);
      // Network hataları - retry yapılabilir
      return { success: false, unauthorized: false, data: null };
    }
  }, []);

  // Tek bir useEffect ile tüm auth flow'u yönet
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);

      if (token) {
        // Token varsa kullanıcı bilgilerini al
        const result = await fetchUserProfile(token, abortController.signal);

        // Component unmount olduysa state güncellemesi yapma
        if (!isMounted) return;

        if (result.success && result.data) {
          setUser(result.data);

          // PostHog identification for analytics
          if (posthog) {
            posthog.identify(result.data.id, {
              email: result.data.email,
              name: result.data.name,
              isAdmin: result.data.isAdmin,
            });
          }
        } else if (result.unauthorized) {
          // Sadece 401 durumunda token'ı temizle
          console.warn("Token is invalid, logging out");
          localStorage.removeItem("auth_token");
          setToken(null);
          setUser(null);

          if (posthog) {
            posthog.reset();
          }
        } else {
          // Diğer hatalar için kullanıcıyı logout etme, mevcut state'i koru
          console.error("Failed to fetch user profile, keeping existing state");
        }
      } else {
        setUser(null);

        if (posthog) {
          posthog.reset();
        }
      }

      setLoading(false);
    };

    initializeAuth();

    // Sayfa yenilendiğinde veya token değiştiğinde kullanıcı bilgilerini güncelle
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "auth_token") {
        setToken(event.newValue);
        if (!event.newValue) {
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      isMounted = false;
      abortController.abort();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [token, fetchUserProfile, posthog]);

  const signOut = () => {
    // Track logout event before clearing user data
    if (posthog && user) {
      posthog.capture('user_signed_out', {
        user_id: user.id,
        logout_method: 'manual',
      });
    }

    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  const updateToken = (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
  };

  const value = {
    user,
    token,
    loading,
    signOut,
    updateToken,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
