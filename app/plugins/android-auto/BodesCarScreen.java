package __PACOTE__.auto;

import androidx.annotation.NonNull;
import androidx.car.app.CarContext;
import androidx.car.app.CarToast;
import androidx.car.app.model.Action;
import androidx.car.app.model.ActionStrip;
import androidx.car.app.model.CarColor;
import androidx.car.app.model.CarIcon;
import androidx.car.app.model.Template;
import androidx.car.app.navigation.model.NavigationTemplate;
import androidx.core.graphics.drawable.IconCompat;
import com.google.android.react.navsdk.AndroidAutoBaseScreen;
import __PACOTE__.R;

/**
 * Tela do carro com a identidade do app: cartão escuro quente e 4 botões com os nossos ícones,
 * na ordem da pesquisa de usabilidade (R26): SOS · Alerta · Postos · Encerrar.
 * O Android Auto aceita no máximo 4 ações; o comboio vira texto da viagem e alertas (próxima etapa).
 * Nada de rede social nem de venda no carro (R28, R32).
 * O cartão de manobra (seta + distância) entra na etapa do Android Auto.
 */
public final class BodesCarScreen extends AndroidAutoBaseScreen {
  /** Cor do cartão: superfície escura no modo noite e clara no modo dia (R17, MR-1). */
  private static final CarColor COR_CARTAO = CarColor.createCustom(0xFFFFFFFF, 0xFF241E19);

  /** Preferência de modo noite pedida pelo app (o próprio Android Auto decide dia/noite na tela do carro). */
  private int modoNoite = 0;

  public BodesCarScreen(@NonNull CarContext carContext) {
    super(carContext);
  }

  // Exigido pela interface INavigationViewController do SDK 0.19, que a tela base não implementa.
  @Override
  public void setNightModeOption(int nightMode) {
    modoNoite = nightMode;
  }

  private CarIcon icone(int recurso) {
    return new CarIcon.Builder(IconCompat.createWithResource(getCarContext(), recurso)).build();
  }

  private Action botao(int texto, int recurso, String evento, int aviso) {
    return new Action.Builder()
        .setTitle(getCarContext().getString(texto))
        .setIcon(icone(recurso))
        .setOnClickListener(
            () -> {
              try {
                sendCustomEvent(evento, null);
              } catch (IllegalStateException appFechado) {
                // O app no celular ainda não abriu o React Native; o aviso local abaixo basta.
              }
              CarToast.makeText(getCarContext(), aviso, CarToast.LENGTH_LONG).show();
            })
        .build();
  }

  @NonNull
  @Override
  public Template onGetTemplate() {
    ActionStrip botoes =
        new ActionStrip.Builder()
            .addAction(botao(R.string.auto_sos, R.drawable.auto_ic_sos, "sos", R.string.auto_aviso_sos))
            .addAction(botao(R.string.auto_alerta, R.drawable.auto_ic_alerta, "alerta", R.string.auto_aviso_em_breve))
            .addAction(botao(R.string.auto_postos, R.drawable.auto_ic_posto, "postos", R.string.auto_aviso_em_breve))
            .addAction(botao(R.string.auto_encerrar, R.drawable.auto_ic_encerrar, "encerrar", R.string.auto_aviso_encerrar))
            .build();
    return new NavigationTemplate.Builder()
        .setBackgroundColor(COR_CARTAO)
        .setActionStrip(botoes)
        .setMapActionStrip(new ActionStrip.Builder().addAction(Action.PAN).build())
        .build();
  }
}
