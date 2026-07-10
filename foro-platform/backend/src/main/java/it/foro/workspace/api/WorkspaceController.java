package it.foro.workspace.api;

import it.foro.platform.security.TenantContext;
import it.foro.workspace.domain.UserDashboardPreference;
import it.foro.workspace.repository.UserDashboardPreferenceRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/workspace")
public class WorkspaceController {
  private final TenantContext tenant;
  private final UserDashboardPreferenceRepository preferences;
  public WorkspaceController(TenantContext tenant, UserDashboardPreferenceRepository preferences){this.tenant=tenant;this.preferences=preferences;}
  public record Widget(String key,String title,boolean duplicable,String route){}
  public record DashboardPreferenceResponse(String themeMode,String dashboardDensity,String personalAccentColor,String widgetLayout){}
  public record UpdateDashboardPreferenceRequest(@NotBlank String themeMode,@NotBlank String dashboardDensity,
    @Pattern(regexp="^#[0-9a-fA-F]{6}$") String personalAccentColor,@Size(max=12000) String widgetLayout){}

  @GetMapping("/widgets")
  public List<Widget> widgets(){
    tenant.studioId();
    return List.of(new Widget("calendar","Calendario",false,"/calendar"),
      new Widget("documents","Documenti",false,"/documents"),
      new Widget("email","Email",true,"/email"),
      new Widget("clients","Clienti",false,"/clients"),
      new Widget("matters","Pratiche / Fascicolo",false,"/matters"));
  }

  @GetMapping("/preferences")
  @Transactional
  public DashboardPreferenceResponse preferences() {
    return toResponse(getOrCreatePreference());
  }

  @PutMapping("/preferences")
  @Transactional
  public DashboardPreferenceResponse updatePreferences(@Valid @RequestBody UpdateDashboardPreferenceRequest request) {
    var preference = getOrCreatePreference();
    preference.update(request.themeMode(), request.dashboardDensity(), request.personalAccentColor(), request.widgetLayout() == null ? "[]" : request.widgetLayout());
    return toResponse(preference);
  }

  private UserDashboardPreference getOrCreatePreference() {
    return preferences.findByStudioIdAndUserId(tenant.studioId(), tenant.userId())
      .orElseGet(() -> preferences.save(new UserDashboardPreference(tenant.studioId(), tenant.userId())));
  }
  private DashboardPreferenceResponse toResponse(UserDashboardPreference p) {
    return new DashboardPreferenceResponse(p.getThemeMode(), p.getDashboardDensity(), p.getPersonalAccentColor(), p.getWidgetLayout());
  }
}
