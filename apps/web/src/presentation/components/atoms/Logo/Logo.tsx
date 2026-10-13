import claro from '../../../assets/revoto-horizontal-claro.svg';
import oscuro from '../../../assets/revoto-horizontal-oscuro.svg';
import estilos from './Logo.module.css';

/** Logotipo horizontal. `claro` para fondos claros (tinta), `oscuro` para fondos oscuros. */
export function Logo({ sobre = 'claro' }: { sobre?: 'claro' | 'oscuro' }) {
  return <img className={estilos.logo} src={sobre === 'claro' ? claro : oscuro} alt="ReVoto" />;
}
