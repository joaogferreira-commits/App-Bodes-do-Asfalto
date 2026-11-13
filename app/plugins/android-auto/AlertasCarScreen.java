package __PACOTE__.auto;

import androidx.annotation.NonNull;
import androidx.car.app.CarContext;
import androidx.car.app.Screen;
import androidx.car.app.model.Action;
import androidx.car.app.model.ItemList;
import androidx.car.app.model.ListTemplate;
import androidx.car.app.model.Row;
import androidx.car.app.model.Template;
import java.util.function.Consumer;
import __PACOTE__.R;

/**
 * Lista dos 6 alertas de estrada para o comboio (mesmos tipos do modo pilotando no celular).
 * Ao tocar, devolve o tipo à tela do carro, que avisa o app (evento "alerta:tipo") e fecha esta lista.
 * Texto grande e uma linha por alerta; nada para digitar (regra de segurança do Android Auto).
 */
public final class AlertasCarScreen extends Screen {
  private static final String[] TIPOS = {"buraco", "policia", "obra", "animal", "acidente", "oleo"};
  private static final int[] TEXTOS = {
    R.string.auto_alerta_buraco,
    R.string.auto_alerta_policia,
    R.string.auto_alerta_obra,
    R.string.auto_alerta_animal,
    R.string.auto_alerta_acidente,
    R.string.auto_alerta_oleo
  };

  private final Consumer<String> aoEscolher;

  public AlertasCarScreen(@NonNull CarContext carContext, @NonNull Consumer<String> aoEscolher) {
    super(carContext);
    this.aoEscolher = aoEscolher;
  }

  @NonNull
  @Override
  public Template onGetTemplate() {
    ItemList.Builder lista = new ItemList.Builder();
    for (int i = 0; i < TIPOS.length; i++) {
      final String tipo = TIPOS[i];
      lista.addItem(
          new Row.Builder()
              .setTitle(getCarContext().getString(TEXTOS[i]))
              .setOnClickListener(
                  () -> {
                    aoEscolher.accept(tipo);
                    getScreenManager().pop();
                  })
              .build());
    }
    return new ListTemplate.Builder()
        .setSingleList(lista.build())
        .setTitle(getCarContext().getString(R.string.auto_alerta))
        .setHeaderAction(Action.BACK)
        .build();
  }
}
