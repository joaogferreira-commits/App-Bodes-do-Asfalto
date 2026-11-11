package __PACOTE__.auto;

import androidx.annotation.NonNull;
import androidx.car.app.CarContext;
import androidx.car.app.CarToast;
import androidx.car.app.model.Action;
import androidx.car.app.model.ActionStrip;
import androidx.car.app.model.Template;
import androidx.car.app.navigation.model.NavigationTemplate;
import com.google.android.react.navsdk.AndroidAutoBaseScreen;
import __PACOTE__.R;

/**
 * Tela do carro (prova da Etapa 0): espelha a navegação do Google e mostra os botões Alerta e SOS.
 * Os demais botões (Comboio, Posto mais próximo, Posto na rota) entram na Etapa 9.
 */
public final class BodesCarScreen extends AndroidAutoBaseScreen {
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

  private Action botao(int texto, String evento) {
    return new Action.Builder()
        .setTitle(getCarContext().getString(texto))
        .setOnClickListener(
            () -> {
              try {
                sendCustomEvent(evento, null);
              } catch (IllegalStateException appFechado) {
                // O app no celular ainda não abriu o React Native; o aviso local abaixo basta.
              }
              CarToast.makeText(getCarContext(), texto, CarToast.LENGTH_SHORT).show();
            })
        .build();
  }

  @NonNull
  @Override
  public Template onGetTemplate() {
    ActionStrip botoes =
        new ActionStrip.Builder()
            .addAction(botao(R.string.auto_alerta, "alerta"))
            .addAction(botao(R.string.auto_sos, "sos"))
            .build();
    return new NavigationTemplate.Builder()
        .setActionStrip(botoes)
        .setMapActionStrip(new ActionStrip.Builder().addAction(Action.PAN).build())
        .build();
  }
}
