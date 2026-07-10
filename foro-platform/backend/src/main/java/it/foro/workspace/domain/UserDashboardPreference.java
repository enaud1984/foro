package it.foro.workspace.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_dashboard_preference", uniqueConstraints = @UniqueConstraint(columnNames = {"studio_id", "user_id"}))
public class UserDashboardPreference {
  @Id private UUID id;
  @Column(name="studio_id", nullable=false) private UUID studioId;
  @Column(name="user_id", nullable=false) private UUID userId;
  @Column(name="theme_mode", nullable=false) private String themeMode;
  @Column(name="dashboard_density", nullable=false) private String dashboardDensity;
  @Column(name="personal_accent_color") private String personalAccentColor;
  @Column(name="widget_layout", columnDefinition="TEXT", nullable=false) private String widgetLayout;
  @Column(name="updated_at", nullable=false) private Instant updatedAt;

  protected UserDashboardPreference(){}
  public UserDashboardPreference(UUID studioId, UUID userId) {
    this.id = UUID.randomUUID();
    this.studioId = studioId;
    this.userId = userId;
    this.themeMode = "LIGHT";
    this.dashboardDensity = "COMFORTABLE";
    this.widgetLayout = "[]";
    this.updatedAt = Instant.now();
  }
  public void update(String themeMode, String dashboardDensity, String personalAccentColor, String widgetLayout) {
    this.themeMode = themeMode;
    this.dashboardDensity = dashboardDensity;
    this.personalAccentColor = personalAccentColor;
    this.widgetLayout = widgetLayout;
    this.updatedAt = Instant.now();
  }
  public String getThemeMode(){return themeMode;}
  public String getDashboardDensity(){return dashboardDensity;}
  public String getPersonalAccentColor(){return personalAccentColor;}
  public String getWidgetLayout(){return widgetLayout;}
}
