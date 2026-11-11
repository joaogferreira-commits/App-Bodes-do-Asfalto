package __PACOTE__.auto;

import android.content.pm.ApplicationInfo;
import androidx.annotation.NonNull;
import androidx.car.app.CarAppService;
import androidx.car.app.Session;
import androidx.car.app.validation.HostValidator;

/** Ponto de entrada do Android Auto (categoria navegação). */
public final class BodesCarAppService extends CarAppService {
  @NonNull
  @Override
  public HostValidator createHostValidator() {
    if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
      return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR;
    }
    return new HostValidator.Builder(getApplicationContext())
        .addAllowedHosts(androidx.car.app.R.array.hosts_allowlist_sample)
        .build();
  }

  @NonNull
  @Override
  public Session onCreateSession() {
    return new BodesCarSession();
  }
}
