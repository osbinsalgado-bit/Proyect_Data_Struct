import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [inst, setInst] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const savedInstId = localStorage.getItem('institucionActualId');
        if (savedInstId) {
          // Buscamos perfil
          const profileId = `${firebaseUser.uid}_${savedInstId}`;
          let uSnap = await getDoc(doc(db, "usuarios", profileId));
          if (!uSnap.exists()) uSnap = await getDoc(doc(db, "usuarios", firebaseUser.uid));

          if (uSnap.exists()) {
            const userData = uSnap.data();
            const instSnap = await getDoc(doc(db, "instituciones", savedInstId));
            setUser({ id: uSnap.id, ...userData });
            if (instSnap.exists()) setInst({ id: instSnap.id, ...instSnap.data() });
            console.log("✅ Sistema Auth: Perfil cargado como", userData.rol);
          }
        }
      } else {
        setUser(null);
        setInst(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, inst, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);