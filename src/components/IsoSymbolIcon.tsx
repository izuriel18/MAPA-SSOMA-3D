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
      // ==========================================
      // EVACUACIÓN Y EMERGENCIA (Verde #16A34A, blanco #FFFFFF)
      // ==========================================
      case 'E_SISMO': // Zona Segura en Caso de Sismos (NTP 399.010-1 / INDECI)
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="32" cy="32" r="21" fill="#FFFFFF" />
            <circle cx="32" cy="32" r="18" fill="#16A34A" />
            <text
              x="32"
              y="41"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="Arial, sans-serif"
              fontWeight="900"
              fontSize="26"
            >
              S
            </text>
          </>
        );

      case 'E001': // Salida de emergencia
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="37" y="13" width="13" height="36" fill="#FFFFFF" />
            <circle cx="24" cy="20" r="3.2" fill="#FFFFFF" />
            <path d="M24 24l6 5 5-2m-11-3l-5 8m5-8l2 10-7 8m9-8l5 9" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'E_RUTA_IZQ': // Flecha Evacuación Izquierda (NTP)
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M22 32l14-13v8h14v10H36v8z" fill="#FFFFFF" />
            <circle cx="15" cy="32" r="3" fill="#FFFFFF" />
          </>
        );

      case 'E_RUTA_DER': // Flecha Evacuación Derecha (NTP)
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M42 32L28 19v8H14v10h14v8z" fill="#FFFFFF" />
            <circle cx="49" cy="32" r="3" fill="#FFFFFF" />
          </>
        );

      case 'E_RUTA_RECTA': // Flecha Evacuación Adelante (NTP)
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M32 18L19 32h8v16h10V32h8z" fill="#FFFFFF" />
          </>
        );

      case 'E007': // Punto de reunión exterior
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="32" cy="32" r="5" fill="#FFFFFF" />
            <path d="M13 13l9 9m0-6v6h-6M51 13l-9 9m6 0h-6v-6M13 51l9-9m-6 0h6v6M51 51l-9-9m0 6v-6h6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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

      case 'E_CAMILLA': // Camilla de emergencia
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="12" y1="28" x2="52" y2="28" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="12" y1="36" x2="52" y2="36" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="17" y="25" width="30" height="14" rx="2" fill="#FFFFFF" />
            <circle cx="23" cy="32" r="3" fill="#16A34A" />
            <line x1="15" y1="23" x2="15" y2="41" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="49" y1="23" x2="49" y2="41" stroke="#FFFFFF" strokeWidth="2.5" />
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
          </>
        );

      case 'E_LUZ': // Luz de emergencia
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="15" y="29" width="34" height="18" rx="3" fill="#FFFFFF" />
            <ellipse cx="23" cy="23" rx="7" ry="5" fill="#FFFFFF" />
            <ellipse cx="41" cy="23" rx="7" ry="5" fill="#FFFFFF" />
            <circle cx="23" cy="23" r="2.5" fill="#FACC15" />
            <circle cx="41" cy="23" r="2.5" fill="#FACC15" />
          </>
        );

      case 'E_ESCALERA': // Escalera de emergencia
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M14 46h8v-9h8v-9h8v-9h12" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="square" />
            <circle cx="21" cy="20" r="3" fill="#FFFFFF" />
            <path d="M21 24l4 6-3 6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );

      // ==========================================
      // CONTRA INCENDIOS (Rojo #DC2626, blanco #FFFFFF)
      // ==========================================
      case 'F001': // Extintor PQS
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="25" y="21" width="14" height="26" rx="3" fill="#FFFFFF" />
            <path d="M29 21v-4h7l6 4" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M25 24l-6 9" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <text x="32" y="38" textAnchor="middle" fill="#DC2626" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="9">
              PQS
            </text>
          </>
        );

      case 'F_CO2': // Extintor CO2
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="25" y="21" width="14" height="26" rx="3" fill="#FFFFFF" />
            <path d="M29 21v-4h7l3 2" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
            <polygon points="40,24 49,20 49,28" fill="#FFFFFF" />
            <text x="32" y="38" textAnchor="middle" fill="#DC2626" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="8">
              CO2
            </text>
          </>
        );

      case 'F_AGUA': // Extintor Agua Presurizada
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="25" y="21" width="14" height="26" rx="3" fill="#FFFFFF" />
            <path d="M29 21v-4h7l6 4" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M32 28c-2 2.5-3.5 4.5-3.5 6.5 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-2-1.5-4-3.5-6.5z" fill="#0284C7" />
          </>
        );

      case 'F_K': // Extintor Acetato de Potasio (Cocinas)
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="25" y="21" width="14" height="26" rx="3" fill="#FFFFFF" />
            <path d="M29 21v-4h7l6 4" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
            <text x="32" y="39" textAnchor="middle" fill="#DC2626" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="11">
              K
            </text>
          </>
        );

      case 'F002': // Gabinete / Manguera (BIE)
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

      case 'F_SIRENA': // Sirena y Luz Estroboscópica
        return (
          <>
            <rect x="5" y="5" width="54" height="54" rx="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <polygon points="18,39 26,39 36,47 36,17 26,25 18,25" fill="#FFFFFF" />
            <path d="M42 24c3 3 3 13 0 16" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <path d="M47 19c6 6 6 22 0 26" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          </>
        );

      // ==========================================
      // ADVERTENCIA (Triángulo amarillo #FACC15, borde negro #0F172A)
      // ==========================================
      case 'W001': // Peligro general
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

      case 'W024': // Atrapamiento
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

      case 'W015': // Cargas suspendidas
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

      case 'W_MONTACARGA': // Montacargas
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <rect x="20" y="33" width="16" height="12" rx="2" fill="#0F172A" />
            <circle cx="24" cy="46" r="3" fill="#0F172A" />
            <circle cx="34" cy="46" r="3" fill="#0F172A" />
            <line x1="37" y1="26" x2="37" y2="47" stroke="#0F172A" strokeWidth="2.5" />
            <line x1="37" y1="43" x2="45" y2="43" stroke="#0F172A" strokeWidth="2.5" />
            <rect x="40" y="31" width="7" height="11" fill="#0F172A" />
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

      case 'W_BIOLOGICO': // Riesgo biológico
        return (
          <>
            <polygon points="32,5 60,55 4,55" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
            <circle cx="32" cy="36" r="5" fill="none" stroke="#0F172A" strokeWidth="2.5" />
            <circle cx="27" cy="32" r="4.5" fill="none" stroke="#0F172A" strokeWidth="2.2" />
            <circle cx="37" cy="32" r="4.5" fill="none" stroke="#0F172A" strokeWidth="2.2" />
            <circle cx="32" cy="41" r="4.5" fill="none" stroke="#0F172A" strokeWidth="2.2" />
            <circle cx="32" cy="36" r="1.5" fill="#0F172A" />
          </>
        );

      // ==========================================
      // OBLIGACIÓN / EPP (Círculo azul #2563EB, blanco #FFFFFF)
      // ==========================================
      case 'M014': // Casco
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M20 34c0-7 5.5-12 12-12s12 5 12 12h-24z" fill="#FFFFFF" />
            <path d="M18 34h28c1 0 2 0.8 2 2s-1 2-2 2H18c-1 0-2-0.8-2-2s1-2 2-2z" fill="#FFFFFF" />
            <rect x="29" y="19" width="6" height="5" rx="1" fill="#FFFFFF" />
          </>
        );

      case 'M008': // Calzado de seguridad
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M20 22h8v12l10 2c3 1 5 3 5 6v2H18v-8l2-14z" fill="#FFFFFF" />
            <rect x="18" y="42" width="25" height="3" rx="1.5" fill="#FFFFFF" />
          </>
        );

      case 'M004': // Lentes
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="18" y="27" width="11" height="11" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="3" />
            <rect x="35" y="27" width="11" height="11" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="29" y1="32" x2="35" y2="32" stroke="#FFFFFF" strokeWidth="3" />
            <path d="M18 30h-3M46 30h3" stroke="#FFFFFF" strokeWidth="2.5" />
          </>
        );

      case 'M003': // Protección auditiva
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M20 32c0-7 5-12 12-12s12 5 12 12" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
            <rect x="17" y="30" width="6" height="11" rx="2" fill="#FFFFFF" />
            <rect x="41" y="30" width="6" height="11" rx="2" fill="#FFFFFF" />
          </>
        );

      case 'M009': // Guantes
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M24 43v-13c0-1.5 1-2.5 2-2.5s2 1 2 2.5v-3c0-1.5 1-2.5 2-2.5s2 1 2 2.5v-2c0-1.5 1-2.5 2-2.5s2 1 2 2.5v2c0-1.5 1-2.5 2-2.5s2 1 2 2.5v13h-14z" fill="#FFFFFF" />
            <path d="M24 33c-2 0-4 1.5-4 4v3l4 3" fill="#FFFFFF" />
          </>
        );

      case 'M016': // Mascarilla / Respirador
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M23 28l9-4 9 4v8c0 5-4 9-9 9s-9-4-9-9v-8z" fill="#FFFFFF" />
            <circle cx="26" cy="35" r="2.5" fill="#2563EB" />
            <circle cx="38" cy="35" r="2.5" fill="#2563EB" />
            <line x1="16" y1="30" x2="23" y2="30" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="41" y1="30" x2="48" y2="30" stroke="#FFFFFF" strokeWidth="2" />
          </>
        );

      case 'M_ARNES': // Arnés de seguridad (G.050)
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="32" cy="18" r="3.5" fill="#FFFFFF" />
            <line x1="26" y1="23" x2="26" y2="40" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="38" y1="23" x2="38" y2="40" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="24" y1="28" x2="40" y2="28" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="24" y1="36" x2="40" y2="36" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="26" y1="40" x2="21" y2="47" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="38" y1="40" x2="43" y2="47" stroke="#FFFFFF" strokeWidth="2.5" />
          </>
        );

      case 'M_CHALECO': // Chaleco reflectivo
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M23 20h6l3 6 3-6h6v24H23V20z" fill="#FFFFFF" />
            <rect x="23" y="32" width="18" height="3" fill="#2563EB" />
            <rect x="23" y="38" width="18" height="3" fill="#2563EB" />
          </>
        );

      // ==========================================
      // PROHIBICIÓN (Círculo rojo #DC2626 con barra oblicua)
      // ==========================================
      case 'P002': // Prohibido fumar
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5.5" />
            <rect x="21" y="30" width="22" height="4" fill="#0F172A" />
            <rect x="39" y="30" width="4" height="4" fill="#DC2626" />
            <path d="M46 27c1-1 1-3 0-4m2 4c1-1 1-3 0-4" stroke="#64748B" strokeWidth="1.6" fill="none" />
            <line x1="14" y1="14" x2="50" y2="50" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" />
          </>
        );

      case 'P006': // No pasar
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5.5" />
            <circle cx="32" cy="22" r="3" fill="#0F172A" />
            <path d="M32 26v9m0 0l-4 8m4-8l4 8m-4-13l-5 4m5-4l5 4" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="14" x2="50" y2="50" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" />
          </>
        );

      case 'P011': // No apagar con agua
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5.5" />
            <path d="M24 38c0-5 8-15 8-15s8 10 8 15a8 8 0 0 1-16 0z" fill="#DC2626" />
            <line x1="14" y1="14" x2="50" y2="50" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" />
          </>
        );

      case 'P_CELULAR': // Prohibido celulares
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5.5" />
            <rect x="25" y="21" width="14" height="22" rx="2" fill="none" stroke="#0F172A" strokeWidth="2.5" />
            <circle cx="32" cy="39" r="1.5" fill="#0F172A" />
            <line x1="14" y1="14" x2="50" y2="50" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" />
          </>
        );

      case 'P_BLOQUEAR': // Prohibido bloquear
        return (
          <>
            <circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5.5" />
            <rect x="23" y="25" width="18" height="14" fill="#0F172A" />
            <line x1="14" y1="14" x2="50" y2="50" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" />
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
