import { useEffect, useRef } from "react";

/**
 * Hook qui intercepte la touche physique ou le geste Retour du téléphone
 * (Android back button, balayage bord gauche iOS/Android) pour fermer une
 * modale ou une feuille ouverte au lieu de quitter l'application.
 *
 * @param isOpen État d'ouverture de la modale/feuille
 * @param onClose Callback appelé pour fermer la modale
 */
export function useMobileBackHandler(isOpen: boolean, onClose: () => void) {
  const isPushedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      isPushedRef.current = false;
      return;
    }

    // Pousser un état dans l'historique à l'ouverture
    if (typeof window !== "undefined") {
      window.history.pushState({ asoroModalOpen: true }, "");
      isPushedRef.current = true;
    }

    const handlePopState = () => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Si la modale est fermée par un clic bouton/croix dans l'interface,
      // on retire l'état empilé pour garder un historique propre
      if (isPushedRef.current) {
        isPushedRef.current = false;
        if (typeof window !== "undefined" && window.history.state?.asoroModalOpen) {
          window.history.back();
        }
      }
    };
  }, [isOpen, onClose]);
}
