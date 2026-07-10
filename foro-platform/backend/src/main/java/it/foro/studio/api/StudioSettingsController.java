package it.foro.studio.api;

import it.foro.identity.domain.Studio;
import it.foro.identity.repository.StudioMembershipRepository;
import it.foro.identity.repository.StudioRepository;
import it.foro.platform.security.TenantContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/studio")
public class StudioSettingsController {
  private final TenantContext tenant;
  private final StudioRepository studios;
  private final StudioMembershipRepository memberships;

  public StudioSettingsController(TenantContext tenant, StudioRepository studios, StudioMembershipRepository memberships) {
    this.tenant = tenant; this.studios = studios; this.memberships = memberships;
  }

  public record StudioProfileResponse(String name,String addressLine,String city,String postalCode,String country,String phone,String website,
    String logoUrl,String primaryColor,String accentColor,String secondaryColor,String themePreset,boolean canEditBranding){}
  public record UpdateStudioProfileRequest(@NotBlank @Size(max=200) String name,@Size(max=240) String addressLine,@Size(max=120) String city,
    @Size(max=20) String postalCode,@Size(max=80) String country,@Size(max=40) String phone,@Size(max=200) String website,@Size(max=8000) String logoUrl,
    @Pattern(regexp="^#[0-9a-fA-F]{6}$") String primaryColor,@Pattern(regexp="^#[0-9a-fA-F]{6}$") String accentColor,
    @Pattern(regexp="^#[0-9a-fA-F]{6}$") String secondaryColor,@NotBlank @Size(max=40) String themePreset){}

  @GetMapping("/profile")
  public StudioProfileResponse profile() {
    var studio = studio();
    return toResponse(studio, isStudioAdmin());
  }

  @PutMapping("/profile")
  @Transactional
  public StudioProfileResponse update(@Valid @RequestBody UpdateStudioProfileRequest request) {
    if (!isStudioAdmin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_STUDIO_ADMIN_CAN_EDIT_BRANDING");
    var studio = studio();
    studio.updateBranding(request.name(), request.addressLine(), request.city(), request.postalCode(), request.country(), request.phone(), request.website(),
      request.logoUrl(), request.primaryColor(), request.accentColor(), request.secondaryColor(), request.themePreset());
    return toResponse(studio, true);
  }

  private Studio studio() {
    return studios.findById(tenant.studioId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "STUDIO_NOT_FOUND"));
  }
  private boolean isStudioAdmin() {
    return memberships.findByStudioIdAndUserId(tenant.studioId(), tenant.userId())
      .filter(m -> "ACTIVE".equals(m.getStatus()))
      .map(m -> "STUDIO_ADMIN".equals(m.getRole()) || "OWNER".equals(m.getRole()))
      .orElse(false);
  }
  private StudioProfileResponse toResponse(Studio s, boolean canEditBranding) {
    return new StudioProfileResponse(s.getName(),s.getAddressLine(),s.getCity(),s.getPostalCode(),s.getCountry(),s.getPhone(),s.getWebsite(),
      s.getLogoUrl(),s.getPrimaryColor(),s.getAccentColor(),s.getSecondaryColor(),s.getThemePreset(),canEditBranding);
  }
}
