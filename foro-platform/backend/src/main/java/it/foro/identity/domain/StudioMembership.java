package it.foro.identity.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="studio_membership")
public class StudioMembership {
  @Id private UUID id;
  @Column(name="studio_id",nullable=false) private UUID studioId;
  @Column(name="user_id",nullable=false) private UUID userId;
  @Column(nullable=false) private String role;
  @Column(nullable=false) private String status;
  @Column(name="created_at",nullable=false) private Instant createdAt;
  protected StudioMembership(){}
  public StudioMembership(UUID studioId,UUID userId,String role,String status){
    this.id=UUID.randomUUID();this.studioId=studioId;this.userId=userId;this.role=role;this.status=status;this.createdAt=Instant.now();
  }
  public UUID getStudioId(){return studioId;} public UUID getUserId(){return userId;} public String getRole(){return role;} public String getStatus(){return status;}
}
