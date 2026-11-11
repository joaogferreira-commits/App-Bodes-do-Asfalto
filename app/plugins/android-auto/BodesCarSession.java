package __PACOTE__.auto;

import android.content.Intent;
import androidx.annotation.NonNull;
import androidx.car.app.Screen;
import androidx.car.app.Session;

public final class BodesCarSession extends Session {
  @NonNull
  @Override
  public Screen onCreateScreen(@NonNull Intent intent) {
    return new BodesCarScreen(getCarContext());
  }
}
