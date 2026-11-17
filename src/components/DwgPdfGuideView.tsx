import React from 'react';
import { ArrowRight, CheckSquare, FileCode2, Layers, ShieldCheck } from 'lucide-react';

interface DwgPdfGuideViewProps {
  onGoToEditor: () => void;
}

export const DwgPdfGuideView: React.FC<DwgPdfGuideViewProps> = ({ onGoToEditor }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Hero Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-medium text-blue-700">
              Metodología recomendada · DWG / PDF + Visión Artificial
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-balance">
              Cómo convertir planos DWG y PDF en un Mapa de Riesgos profesional con ayuda de la IA
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Los archivos nativos <span className="font-mono text-slate-900">.dwg</span> son binarios propietarios de AutoCAD. Siguiendo este flujo de 4 pasos obtendrás una lectura arquitectónica limpia para que la IA detecte zonas, salidas y peligros con alta precisión.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToEditor}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Ir al Editor de Plano
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4-Step Practical Workflow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base">
              <FileCode2 className="w-5 h-5 text-blue-600 shrink-0" />
              <span>01. Limpieza previa en AutoCAD / CAD (Clave)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Un plano constructivo completo tiene demasiado ruido visual (cotas, ejes estructurales, instalaciones sanitarias) que confunde tanto al trabajador como a la IA. Antes de exportar tu <span className="font-mono">.dwg</span>:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
              <li>
                Apaga o congela (<span className="font-mono">LAYOFF</span>) las capas de cotas, ejes, sombreados (<span className="font-mono">HATCH</span>) densos y mobiliario menor.
              </li>
              <li>
                Deja visibles solo: <strong>muros, puertas, escaleras, maquinaria fija, tableros eléctricos, racks y textos de nombres de ambiente</strong>.
              </li>
              <li>
                Cambia el fondo a blanco y usa líneas negras o grises oscuras (<span className="font-mono">monochrome.ctb</span>) para lograr máximo contraste.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base">
              <Layers className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>02. Exportar desde DWG a PDF o DXF</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tienes dos formatos ideales para trabajar en <strong>MapaRiesgo Studio</strong>:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Opción A — PDF Vectorial (Recomendada):</strong> Desde AutoCAD usa <span className="font-mono">EXPORTPDF</span> o <span className="font-mono">DWG To PDF.pc3</span> en formato A3/A1 horizontal. Conserva los textos de cada ambiente nítidos para que la IA los lea.
              </li>
              <li>
                <strong>Opción B — DXF ASCII:</strong> Si prefieres seguir controlando capas dentro de esta herramienta, usa <span className="font-mono">GUARDAR COMO → AutoCAD DXF</span>. Al subir el <span className="font-mono">.dxf</span> aquí podrás activar o apagar cada capa CAD antes de analizar.
              </li>
              <li>
                <strong>Tip si no tienes AutoCAD instalado:</strong> Usa <em>LibreCAD</em> (gratuito para DXF) o <em>Autodesk Viewer</em> web para imprimir tu DWG a PDF.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <span>03. Cómo aprovechar la IA sin errores</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              En la pestaña derecha <strong>Asistente IA</strong>, indica el tipo de instalación y la normativa aplicable antes de pulsar <strong>Analizar Plano con IA</strong>:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
              <li>
                La IA identifica automáticamente <strong>zonas IPER</strong> (soldadura, tableros, químicos, tránsito de montacargas), propone <strong>pictogramas ISO 7010</strong> y traza <strong>rutas de evacuación</strong> hacia puertas exteriores.
              </li>
              <li>
                Después de aplicar la propuesta al mapa, <strong>arrastra los pictogramas</strong> si necesitas ajustarlos a la pared exacta o columna donde irán colgados.
              </li>
              <li>
                Usa el <strong>Consultor SST</strong> integrado para validar distancias máximas de recorrido a extintores (ej. 15 m a 23 m según tipo de fuego NFPA 10) o señalética obligatoria.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base">
              <CheckSquare className="w-5 h-5 text-red-600 shrink-0" />
              <span>04. Verificación obligatoria en campo</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              La IA acelera el 80% del trazado e inventario, pero la aprobación legal del Mapa de Riesgos exige validación presencial del prevencionista o comité SST:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
              <li>
                Verifica en sitio el <strong>sentido real de apertura de puertas</strong> de emergencia y que no existan obstáculos en pasillos.
              </li>
              <li>
                Confirma el agente extintor correcto por zona (CO₂ para tableros eléctricos, PQS ABC para sólidos/inflamables, Clase K para cocinas).
              </li>
              <li>
                Ajusta los puntajes <strong>Probabilidad × Severidad</strong> en la pestaña <em>Matriz IPER</em> acorde a tu historial de incidentes y mediciones (ruido dBA, iluminación lux).
              </li>
            </ul>
          </div>
        </div>

        {/* ISO 7010 Color Code Reference */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Código Geométrico y Cromático Oficial (ISO 7010 / NTP 399.010-1)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Categoría</th>
                  <th className="py-2 pr-4 font-semibold">Forma y Color</th>
                  <th className="py-2 pr-4 font-semibold">Significado</th>
                  <th className="py-2 font-semibold">Ejemplos en Plano</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-amber-700">Advertencia</td>
                  <td className="py-2.5 pr-4">Triángulo amarillo, borde negro</td>
                  <td className="py-2.5 pr-4">Precaución ante peligro presente</td>
                  <td className="py-2.5">Riesgo eléctrico, atrapamiento, inflamables, ruido</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-blue-700">Obligación (EPP)</td>
                  <td className="py-2.5 pr-4">Círculo azul, pictograma blanco</td>
                  <td className="py-2.5 pr-4">Comportamiento o EPP obligatorio</td>
                  <td className="py-2.5">Casco, lentes, tapones auditivos, guantes, botas</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-red-700">Prohibición</td>
                  <td className="py-2.5 pr-4">Círculo blanco con banda roja tachada</td>
                  <td className="py-2.5 pr-4">Acción peligrosa prohibida</td>
                  <td className="py-2.5">Prohibido fumar, solo personal autorizado, no usar agua</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-red-700">Contra Incendios</td>
                  <td className="py-2.5 pr-4">Cuadrado rojo, pictograma blanco</td>
                  <td className="py-2.5 pr-4">Ubicación de equipo de respuesta</td>
                  <td className="py-2.5">Extintor PQS/CO2, gabinete BIE, pulsador alarma</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-emerald-700">Salvamento / Evacuación</td>
                  <td className="py-2.5 pr-4">Cuadrado verde, pictograma blanco</td>
                  <td className="py-2.5 pr-4">Ruta segura, salida o auxilio</td>
                  <td className="py-2.5">Salida emergencia, botiquín, punto de reunión, lavaojos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
