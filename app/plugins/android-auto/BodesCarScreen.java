package __PACOTE__.auto;

import androidx.annotation.NonNull;
import androidx.car.app.CarContext;
import androidx.car.app.CarToast;
import androidx.car.app.model.Action;
import androidx.car.app.model.ActionStrip;
import androidx.car.app.model.CarColor;
import androidx.car.app.model.CarIcon;
import androidx.car.app.model.DateTimeWithZone;
import androidx.car.app.model.Distance;
import androidx.car.app.model.Template;
import androidx.car.app.navigation.model.Maneuver;
import androidx.car.app.navigation.model.NavigationTemplate;
import androidx.car.app.navigation.model.RoutingInfo;
import androidx.car.app.navigation.model.Step;
import androidx.car.app.navigation.model.TravelEstimate;
import androidx.core.graphics.drawable.IconCompat;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.libraries.mapsplatform.turnbyturn.model.NavInfo;
import com.google.android.libraries.mapsplatform.turnbyturn.model.StepInfo;
import com.google.android.react.navsdk.AndroidAutoBaseScreen;
import com.google.android.react.navsdk.NavInfoReceivingService;
import java.util.TimeZone;
import __PACOTE__.R;

/**
 * Tela do carro com a identidade do app: cartão escuro quente e 4 botões com os nossos ícones,
 * na ordem da pesquisa de usabilidade (R26): SOS · Alerta · Postos · Encerrar.
 * O Android Auto aceita no máximo 4 ações; o comboio vira texto da viagem e alertas (próxima etapa).
 * Nada de rede social nem de venda no carro (R28, R32).
 * Cartão de manobra: seta + distância + rua da próxima curva, e chegada prevista (dados do Google
 * pelo NavInfoReceivingService). Mapa com Mover, Mais zoom, Menos zoom e Recentrar.
 */
public final class BodesCarScreen extends AndroidAutoBaseScreen {
  /** Cor do cartão: superfície escura no modo noite e clara no modo dia (R17, MR-1). */
  private static final CarColor COR_CARTAO = CarColor.createCustom(0xFFFFFFFF, 0xFF241E19);

  /** Preferência de modo noite pedida pelo app (o próprio Android Auto decide dia/noite na tela do carro). */
  private int modoNoite = 0;

  /** Última informação de navegação do Google (null = ainda não está guiando). */
  private NavInfo navInfo;

  /** Estado "recalculando" do Google (NavState.REROUTING). */
  private static final int RECALCULANDO = 2;

  public BodesCarScreen(@NonNull CarContext carContext) {
    super(carContext);
    // A tela do carro é dona do próprio ciclo de vida: o observador sai sozinho quando ela fecha.
    NavInfoReceivingService.getNavInfoLiveData()
        .observe(
            this,
            info -> {
              navInfo = info;
              invalidate();
            });
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

  /** Distância como o irmão fala: "300 m", "1,2 km", "15 km". */
  static Distance distancia(int metros) {
    if (metros < 1000) {
      int redondo = metros < 100 ? Math.max(10, Math.round(metros / 10f) * 10) : Math.round(metros / 50f) * 50;
      return Distance.create(redondo, Distance.UNIT_METERS);
    }
    double km = metros / 1000.0;
    return km < 10
        ? Distance.create(Math.round(km * 10) / 10.0, Distance.UNIT_KILOMETERS_P1)
        : Distance.create(Math.round(km), Distance.UNIT_KILOMETERS);
  }

  private RoutingInfo cartaoDeManobra() {
    if (navInfo != null && navInfo.getNavState() == RECALCULANDO) {
      return new RoutingInfo.Builder().setLoading(true).build();
    }
    StepInfo passo = navInfo == null ? null : navInfo.getCurrentStep();
    Integer metros = navInfo == null ? null : navInfo.getDistanceToCurrentStepMeters();
    if (passo == null || metros == null) return null;
    int[] manobra = ManobraCarro.converter(passo.getManeuver());
    Maneuver m = new Maneuver.Builder(manobra[0]).setIcon(icone(manobra[1])).build();
    String rua = passo.getSimpleRoadName() != null ? passo.getSimpleRoadName() : passo.getFullRoadName();
    String instrucao = passo.getFullInstructionText();
    Step.Builder etapa = new Step.Builder(instrucao != null ? instrucao : (rua != null ? rua : "")).setManeuver(m);
    if (rua != null) etapa.setRoad(rua);
    return new RoutingInfo.Builder().setCurrentStep(etapa.build(), distancia(metros)).build();
  }

  private TravelEstimate chegada() {
    if (navInfo == null) return null;
    Integer metros = navInfo.getDistanceToFinalDestinationMeters();
    Integer segundos = navInfo.getTimeToFinalDestinationSeconds();
    if (metros == null || segundos == null) return null;
    DateTimeWithZone hora =
        DateTimeWithZone.create(System.currentTimeMillis() + segundos * 1000L, TimeZone.getDefault());
    return new TravelEstimate.Builder(distancia(metros), hora).setRemainingTimeSeconds(segundos).build();
  }

  private Action botaoMapa(int recurso, Runnable acao) {
    return new Action.Builder().setIcon(icone(recurso)).setOnClickListener(acao::run).build();
  }

  private void zoom(boolean aproximar) {
    if (mGoogleMap == null) return;
    mGoogleMap.animateCamera(aproximar ? CameraUpdateFactory.zoomIn() : CameraUpdateFactory.zoomOut());
  }

  private void recentrar() {
    if (mGoogleMap == null) return;
    mGoogleMap.followMyLocation(GoogleMap.CameraPerspective.TILTED);
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
    ActionStrip mapa =
        new ActionStrip.Builder()
            .addAction(Action.PAN)
            .addAction(botaoMapa(R.drawable.auto_ic_zoom_mais, () -> zoom(true)))
            .addAction(botaoMapa(R.drawable.auto_ic_zoom_menos, () -> zoom(false)))
            .addAction(botaoMapa(R.drawable.auto_ic_recentrar, this::recentrar))
            .build();
    NavigationTemplate.Builder modelo =
        new NavigationTemplate.Builder()
            .setBackgroundColor(COR_CARTAO)
            .setActionStrip(botoes)
            .setMapActionStrip(mapa);
    RoutingInfo cartao = cartaoDeManobra();
    if (cartao != null) modelo.setNavigationInfo(cartao);
    TravelEstimate estimativa = chegada();
    if (estimativa != null && cartao != null) modelo.setDestinationTravelEstimate(estimativa);
    return modelo.build();
  }
}
