import React from 'react';

interface IsoSymbolIconProps {
  symbolId: string;
  size?: number;
  className?: string;
}

export const IsoSymbolIcon: React.FC<IsoSymbolIconProps> = ({
  symbolId,
  size = 28,
  className = '',
}) => {
  const renderShape = () => {
    switch (symbolId) {
      // ADVERTENCIA (Triángulo amarillo, borde negro)
      case 'W001':
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <rect x="29.5" y="21" width="5" height="19" rx="2" fill="#0F172A" />
            <circle cx="32" cy="46.5" r="3.2" fill="#0F172A" />
          </>
        );
      case 'W012': // Riesgo eléctrico
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <polygon points="35,18 24,35 31,35 27,49 41,31 33,31" fill="#0F172A" />
          </>
        );
      case 'W021': // Inflamable
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M32 21c2 5 7 7 7 14 0 5-3.5 9-7 10-3.5-1-7-5-7-10 0-3 1.5-5.5 3-7 0 2.5 1.5 3.5 2.5 3.5-0.5-4 0.5-7 1.5-10.5z" fill="#0F172A" />
            <rect x="22" y="47" width="20" height="2.5" fill="#0F172A" />
          </>
        );
      case 'W024': // Atrapamiento / Maquinaria
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <circle cx="26" cy="39" r="7" fill="none" stroke="#0F172A" strokeWidth="3.2" strokeDasharray="3 2" />
            <circle cx="39" cy="35" r="5" fill="none" stroke="#0F172A" strokeWidth="3" strokeDasharray="2.5 1.8" />
            <circle cx="26" cy="39" r="2.2" fill="#0F172A" />
            <circle cx="39" cy="35" r="1.8" fill="#0F172A" />
          </>
        );
      case 'W008': // Caída distinto nivel
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <polyline points="17,48 27,48 27,36 37,36" fill="none" stroke="#0F172A" strokeWidth="3" />
            <circle cx="38" cy="24" r="2.6" fill="#0F172A" />
            <path d="M36 28l-5 8m5-8l6 5m-6-5l2 9" stroke="#0F172A" strokeWidth="2.6" strokeLinecap="round" />
          </>
        );
      case 'W011': // Superficie resbaladiza
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <line x1="18" y1="49" x2="46" y2="49" stroke="#0F172A" strokeWidth="2.8" />
            <circle cx="35" cy="24" r="2.6" fill="#0F172A" />
            <path d="M33 28l-6 9m6-9l7 6m-7-6l-2 10m2 0l6 6" stroke="#0F172A" strokeWidth="2.6" strokeLinecap="round" />
          </>
        );
      case 'W016': // Químico / Tóxico
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M28 24h8v7l6 13H22l6-13z" fill="none" stroke="#0F172A" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M24 41h16l2 3H22z" fill="#0F172A" />
          </>
        );
      case 'W015': // Carga suspendida
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <line x1="32" y1="18" x2="32" y2="27" stroke="#0F172A" strokeWidth="2.6" />
            <path d="M32 27c2 0 3 2 1 3.5l-1 1" fill="none" stroke="#0F172A" strokeWidth="2.4" />
            <line x1="32" y1="32" x2="23" y2="39" stroke="#0F172A" strokeWidth="2" />
            <line x1="32" y1="32" x2="41" y2="39" stroke="#0F172A" strokeWidth="2" />
            <rect x="22" y="39" width="20" height="9" fill="#0F172A" />
          </>
        );
      case 'W_NOISE': // Ruido intenso
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M24 34h5l7-6v20l-7-6h-5z" fill="#0F172A" />
            <path d="M39 33c2.5 2.5 2.5 7.5 0 10" fill="none" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M43 30c3.5 4.5 3.5 11.5 0 16" fill="none" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
          </>
        );

      // OBLIGACIÓN / EPP (Círculo azul, blanco)
      case 'M014': // Casco
        return (
          <>
            <circle cx="32" cy="32" r="27" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M18 36c0-9 6-15 14-15s14 6 14 15H18z" fill="#FFFFFF" />
            <rect x="15" y="36" width="34" height="4" rx="2" fill="#FFFFFF" />
            <rect x="29" y="19" width="6" height="17" fill="#2563EB" opacity="0.25" />
          </>
        );
      case 'M004': // Protección ocular
        return (
          <>
            <circle cx="32" cy="32" r="27" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
            <rect x="14" y="25" width="15" height="11" rx="3" fill="#FFFFFF" />
            <rect x="35" y="25" width="15" height="11" rx="3" fill="#FFFFFF" />
            <path d="M29 29h6" stroke="#FFFFFF" strokeWidth="3" />
          </>
        );
      case 'M003': // Protección auditiva
        return (
          <>
            <circle cx="32" cy="32" r="27" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M18 34v-4a14 14 0 0 1 28 0v4" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
            <rect x="14" y="31" width="7" height="13" rx="3.5" fill="#FFFFFF" />
            <rect x="43" y="31" width="7" height="13" rx="3.5" fill="#FFFFFF" />
          </>
        );
      case 'M009': // Guantes
        return (
          <>
            <circle cx="32" cy="32" r="27" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M22 45V27a2 2 0 0 1 4 0v7h2V21a2 2 0 0 1 4 0v13h2V22a2 2 0 0 1 4 0v12h2V26a2 2 0 0 1 4 0v15l-4 6H22z" fill="#FFFFFF" />
          </>
        );
      case 'M008': // Calzado seguridad
        return (
          <>
            <circle cx="32" cy="32" r="27" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M20 20h12v14l14 4v6H18V20z" fill="#FFFFFF" />
            <rect x="18" y="45" width="28" height="3.5" fill="#FFFFFF" />
          </>
        );
      case 'M016': // Protección respiratoria
        return (
          <>
            <circle cx="32" cy="32" r="27" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="32" cy="24" r="7" fill="#FFFFFF" />
            <path d="M22 36h20l-4 11H26z" fill="#FFFFFF" />
            <circle cx="32" cy="41" r="3" fill="#2563EB" />
          </>
        );

      // PROHIBICIÓN (Círculo blanco con borde y barra diagonal roja)
      case 'P002': // Prohibido fumar / llama
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5.5" />
            <rect x="17" y="33" width="24" height="5" fill="#0F172A" />
            <rect x="43" y="33" width="4" height="5" fill="#0F172A" />
            <path d="M44 29c0-4 3-5 2-9" fill="none" stroke="#0F172A" strokeWidth="2.2" />
            <line x1="14" y1="14" x2="50" y2="50" stroke="#DC2626" strokeWidth="5.5" />
          </>
        );
      case 'P006': // Acceso restringido
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5.5" />
            <circle cx="32" cy="20" r="4" fill="#0F172A" />
            <path d="M26 26h12l-2 12h-2l-1 10h-2l-1-10h-2z" fill="#0F172A" />
            <line x1="14" y1="14" x2="50" y2="50" stroke="#DC2626" strokeWidth="5.5" />
          </>
        );
      case 'P011': // Prohibido apagar con agua
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5.5" />
            <path d="M32 18c4 6 8 11 8 16a8 8 0 0 1-16 0c0-5 4-10 8-16z" fill="#0F172A" />
            <line x1="14" y1="14" x2="50" y2="50" stroke="#DC2626" strokeWidth="5.5" />
          </>
        );

      // CONTRA INCENDIOS (Cuadrado rojo, pictograma blanco)
      case 'F001': // Extintor
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="25" y="23" width="14" height="26" rx="3" fill="#FFFFFF" />
            <path d="M29 23v-4h7l6 4" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M25 26l-6 9" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="32" cy="32" r="2.2" fill="#DC2626" />
          </>
        );
      case 'F002': // Gabinete / Manguera
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="29" cy="31" r="11" fill="none" stroke="#FFFFFF" strokeWidth="4" />
            <circle cx="29" cy="31" r="3" fill="#FFFFFF" />
            <path d="M29 42h15l5-4" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
          </>
        );
      case 'F005': // Pulsador alarma
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="17" y="17" width="30" height="30" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
            <circle cx="32" cy="32" r="6" fill="#FFFFFF" />
          </>
        );

      // EVACUACIÓN Y SALVAMENTO (Cuadrado verde, pictograma blanco)
      case 'E001': // Salida de emergencia
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="37" y="13" width="13" height="36" fill="#FFFFFF" />
            <circle cx="24" cy="20" r="3.2" fill="#FFFFFF" />
            <path d="M24 24l6 5 5-2m-11-3l-5 8m5-8l2 10-7 8m9-8l5 9" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      case 'E003': // Botiquín
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="27" y="14" width="10" height="36" fill="#FFFFFF" />
            <rect x="14" y="27" width="36" height="10" fill="#FFFFFF" />
          </>
        );
      case 'E007': // Punto de reunión
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="32" cy="32" r="5" fill="#FFFFFF" />
            <path d="M13 13l9 9m0-6v6h-6M51 13l-9 9m6 0h-6v-6M13 51l9-9m-6 0h6v6M51 51l-9-9m0 6v-6h6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      case 'E012': // Ducha / Lavaojos
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M22 15h10v5l6 6H26l6-6" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
            <line x1="27" y1="31" x2="25" y2="39" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="32" y1="31" x2="32" y2="41" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="37" y1="31" x2="39" y2="39" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <rect x="27" y="45" width="10" height="5" fill="#FFFFFF" />
            <rect x="29.5" y="42.5" width="5" height="10" fill="#FFFFFF" />
          </>
        );

      default:
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <rect x="29.5" y="21" width="5" height="19" rx="2" fill="#0F172A" />
            <circle cx="32" cy="46.5" r="3.2" fill="#0F172A" />
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      {renderShape()}
    </svg>
  );
};
