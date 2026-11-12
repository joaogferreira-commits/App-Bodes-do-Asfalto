package __PACOTE__.auto;

import androidx.car.app.navigation.model.Maneuver;
import __PACOTE__.R;

/**
 * Converte a manobra do Google (StepInfo.getManeuver(), mesmos números do enum Maneuver do SDK
 * em JavaScript) no tipo de manobra do Android Auto e no nosso ícone de seta.
 * Tabela conferida por plugins/android-auto.test.js.
 */
final class ManobraCarro {
  private ManobraCarro() {}

  /** {tipo do Android Auto, ícone} */
  static int[] converter(int google) {
    switch (google) {
      case 1: return par(Maneuver.TYPE_DEPART, R.drawable.auto_man_reto);
      case 2: return par(Maneuver.TYPE_DESTINATION, R.drawable.auto_man_chegada);
      case 3: return par(Maneuver.TYPE_DESTINATION_LEFT, R.drawable.auto_man_chegada);
      case 4: return par(Maneuver.TYPE_DESTINATION_RIGHT, R.drawable.auto_man_chegada);
      case 5: return par(Maneuver.TYPE_STRAIGHT, R.drawable.auto_man_reto);
      case 6: return par(Maneuver.TYPE_TURN_NORMAL_LEFT, R.drawable.auto_man_esquerda);
      case 7: return par(Maneuver.TYPE_TURN_NORMAL_RIGHT, R.drawable.auto_man_direita);
      case 8: return par(Maneuver.TYPE_KEEP_LEFT, R.drawable.auto_man_leve_esquerda);
      case 9: return par(Maneuver.TYPE_KEEP_RIGHT, R.drawable.auto_man_leve_direita);
      case 10: return par(Maneuver.TYPE_TURN_SLIGHT_LEFT, R.drawable.auto_man_leve_esquerda);
      case 11: return par(Maneuver.TYPE_TURN_SLIGHT_RIGHT, R.drawable.auto_man_leve_direita);
      case 12: return par(Maneuver.TYPE_TURN_SHARP_LEFT, R.drawable.auto_man_esquerda);
      case 13: return par(Maneuver.TYPE_TURN_SHARP_RIGHT, R.drawable.auto_man_direita);
      case 14: return par(Maneuver.TYPE_U_TURN_RIGHT, R.drawable.auto_man_retorno_direita);
      case 15: return par(Maneuver.TYPE_U_TURN_LEFT, R.drawable.auto_man_retorno_esquerda);
      case 16: return par(Maneuver.TYPE_MERGE_SIDE_UNSPECIFIED, R.drawable.auto_man_reto);
      case 17: return par(Maneuver.TYPE_MERGE_LEFT, R.drawable.auto_man_leve_esquerda);
      case 18: return par(Maneuver.TYPE_MERGE_RIGHT, R.drawable.auto_man_leve_direita);
      case 19: return par(Maneuver.TYPE_FORK_LEFT, R.drawable.auto_man_leve_esquerda);
      case 20: return par(Maneuver.TYPE_FORK_RIGHT, R.drawable.auto_man_leve_direita);
      case 63:
      case 64: return par(Maneuver.TYPE_FERRY_BOAT, R.drawable.auto_man_reto);
      case 65: return par(Maneuver.TYPE_NAME_CHANGE, R.drawable.auto_man_reto);
      default:
        break;
    }
    if (google >= 43 && google <= 62) {
      // Rotatória: sentido horário nos números ímpares (43, 45, ...).
      boolean horario = google % 2 == 1;
      return par(
          horario ? Maneuver.TYPE_ROUNDABOUT_ENTER_CW : Maneuver.TYPE_ROUNDABOUT_ENTER_CCW,
          R.drawable.auto_man_rotatoria);
    }
    if (google >= 21 && google <= 42) {
      // Entradas (21–31) e saídas (32–42) de rodovia: lado pelo nome; esquerda nos números pares de 22/33...
      boolean saida = google >= 32;
      int base = saida ? 32 : 21;
      int resto = google - base; // 0 sem lado; ímpar = esquerda; par = direita
      if (resto == 0) {
        return par(saida ? Maneuver.TYPE_OFF_RAMP_NORMAL_RIGHT : Maneuver.TYPE_ON_RAMP_NORMAL_RIGHT, R.drawable.auto_man_reto);
      }
      boolean esquerda = resto % 2 == 1;
      int tipo =
          saida
              ? (esquerda ? Maneuver.TYPE_OFF_RAMP_NORMAL_LEFT : Maneuver.TYPE_OFF_RAMP_NORMAL_RIGHT)
              : (esquerda ? Maneuver.TYPE_ON_RAMP_NORMAL_LEFT : Maneuver.TYPE_ON_RAMP_NORMAL_RIGHT);
      return par(tipo, esquerda ? R.drawable.auto_man_leve_esquerda : R.drawable.auto_man_leve_direita);
    }
    return par(Maneuver.TYPE_UNKNOWN, R.drawable.auto_man_reto);
  }

  private static int[] par(int tipo, int icone) {
    return new int[] {tipo, icone};
  }
}
