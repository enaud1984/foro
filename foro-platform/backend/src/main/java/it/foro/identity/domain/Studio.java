package it.foro.identity.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="studio")
public class Studio {
  @Id private UUID id;
  @Column(nullable=false) private String name;
  @Column(name="address_line") private String addressLine;
  private String city;
  @Column(name="postal_code") private String postalCode;
  private String country;
  private String phone;
  private String website;
  @Column(name="logo_url", columnDefinition="TEXT") private String logoUrl;
  @Column(name="primary_color", nullable=false) private String primaryColor;
  @Column(name="accent_color", nullable=false) private String accentColor;
  @Column(name="secondary_color", nullable=false) private String secondaryColor;
  @Column(name="theme_preset", nullable=false) private String themePreset;
  @Column(nullable=false) private String status;
  @Column(name="created_at", nullable=false) private Instant createdAt;
  protected Studio(){}
  public Studio(String name){
    this.id=UUID.randomUUID();this.name=name;this.status="ACTIVE";this.createdAt=Instant.now();
    this.primaryColor="#092746";this.accentColor="#c9993a";this.secondaryColor="#128c8c";this.themePreset="foro-classic";
  }
  public void updateBranding(String name,String addressLine,String city,String postalCode,String country,String phone,String website,
      String logoUrl,String primaryColor,String accentColor,String secondaryColor,String themePreset){
    this.name=name;this.addressLine=addressLine;this.city=city;this.postalCode=postalCode;this.country=country;this.phone=phone;this.website=website;
    this.logoUrl=logoUrl;this.primaryColor=primaryColor;this.accentColor=accentColor;this.secondaryColor=secondaryColor;this.themePreset=themePreset;
  }
  public UUID getId(){return id;} public String getName(){return name;}
  public String getAddressLine(){return addressLine;} public String getCity(){return city;} public String getPostalCode(){return postalCode;}
  public String getCountry(){return country;} public String getPhone(){return phone;} public String getWebsite(){return website;} public String getLogoUrl(){return logoUrl;}
  public String getPrimaryColor(){return primaryColor;} public String getAccentColor(){return accentColor;} public String getSecondaryColor(){return secondaryColor;}
  public String getThemePreset(){return themePreset;}
}
