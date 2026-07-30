package it.foro.pratiche.application;

import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ArchivioDocumentiPratica {
  public static final long DIMENSIONE_MASSIMA = 25L * 1024 * 1024;
  private static final Set<String> MIME_AMMESSI = Set.of(
    "application/pdf", "image/png", "image/jpeg", "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  private final Path radice;

  public ArchivioDocumentiPratica(@Value("${foro.documenti.directory:${java.io.tmpdir}/foro-documenti}") String directory) {
    radice = Paths.get(directory).toAbsolutePath().normalize();
  }

  public DocumentoSalvato salva(UUID studioId, UUID praticaId, MultipartFile file) {
    if (file == null || file.isEmpty()) throw new IllegalArgumentException("PRATICA_DOCUMENTO_NON_VALIDO");
    if (file.getSize() > DIMENSIONE_MASSIMA) throw new IllegalArgumentException("PRATICA_DOCUMENTO_TROPPO_GRANDE");
    var nomeOriginale = Optional.ofNullable(file.getOriginalFilename()).orElse("documento");
    if (nomeOriginale.contains("/") || nomeOriginale.contains("\\") || nomeOriginale.contains("..")) {
      throw new IllegalArgumentException("PRATICA_DOCUMENTO_NON_VALIDO");
    }
    try {
      var cartella = radice.resolve(studioId.toString()).resolve(praticaId.toString()).normalize();
      if (!cartella.startsWith(radice)) throw new IllegalArgumentException("PRATICA_DOCUMENTO_NON_VALIDO");
      Files.createDirectories(cartella);
      var destinazione = cartella.resolve(UUID.randomUUID().toString()).normalize();
      if (!destinazione.startsWith(cartella)) throw new IllegalArgumentException("PRATICA_DOCUMENTO_NON_VALIDO");
      try (var ingresso = file.getInputStream()) {
        Files.copy(ingresso, destinazione, StandardCopyOption.REPLACE_EXISTING);
      }
      var mime = rilevaMime(destinazione, nomeOriginale);
      if (!MIME_AMMESSI.contains(mime) || !firmaCoerente(destinazione, mime)) {
        Files.deleteIfExists(destinazione);
        throw new IllegalArgumentException("PRATICA_DOCUMENTO_TIPO_NON_AMMESSO");
      }
      return new DocumentoSalvato(nomeOriginale, mime, Files.size(destinazione), destinazione.toString(), checksum(destinazione));
    } catch (IOException | NoSuchAlgorithmException e) {
      throw new IllegalStateException("PRATICA_DOCUMENTO_NON_VALIDO", e);
    }
  }

  public DocumentoSalvato salvaGenerato(UUID studioId, UUID praticaId, String nomeFile, byte[] contenuto, String mimeType) {
    if (contenuto == null || contenuto.length == 0 || contenuto.length > DIMENSIONE_MASSIMA
      || nomeFile == null || nomeFile.isBlank() || nomeFile.contains("/") || nomeFile.contains("\\") || nomeFile.contains("..")
      || !MIME_AMMESSI.contains(mimeType)) {
      throw new IllegalArgumentException("PRATICA_DOCUMENTO_NON_VALIDO");
    }
    try {
      var cartella = radice.resolve(studioId.toString()).resolve(praticaId.toString()).normalize();
      if (!cartella.startsWith(radice)) throw new IllegalArgumentException("PRATICA_DOCUMENTO_NON_VALIDO");
      Files.createDirectories(cartella);
      var destinazione = cartella.resolve(UUID.randomUUID().toString()).normalize();
      if (!destinazione.startsWith(cartella)) throw new IllegalArgumentException("PRATICA_DOCUMENTO_NON_VALIDO");
      Files.write(destinazione, contenuto, StandardOpenOption.CREATE_NEW);
      return new DocumentoSalvato(nomeFile, mimeType, contenuto.length, destinazione.toString(), checksum(destinazione));
    } catch (IOException | NoSuchAlgorithmException e) {
      throw new IllegalStateException("PRATICA_DOCUMENTO_NON_VALIDO", e);
    }
  }

  public byte[] leggi(String percorso) {
    try {
      var file = Paths.get(percorso).toAbsolutePath().normalize();
      if (!file.startsWith(radice) || !Files.isRegularFile(file)) throw new IllegalArgumentException("PRATICA_DOCUMENTO_NON_VALIDO");
      return Files.readAllBytes(file);
    } catch (IOException e) {
      throw new IllegalStateException("PRATICA_DOCUMENTO_NON_VALIDO", e);
    }
  }

  public void elimina(String percorso) {
    if (percorso == null) return;
    try {
      var file = Paths.get(percorso).toAbsolutePath().normalize();
      if (file.startsWith(radice)) Files.deleteIfExists(file);
    } catch (IOException ignored) {
      // La cancellazione logica dei metadati resta autorevole; il cleanup fisico può essere riconciliato.
    }
  }

  private String rilevaMime(Path file, String nome) throws IOException {
    var rilevato = Files.probeContentType(file);
    if (rilevato != null) return rilevato;
    var minuscolo = nome.toLowerCase(Locale.ROOT);
    if (minuscolo.endsWith(".pdf")) return "application/pdf";
    if (minuscolo.endsWith(".png")) return "image/png";
    if (minuscolo.endsWith(".jpg") || minuscolo.endsWith(".jpeg")) return "image/jpeg";
    if (minuscolo.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (minuscolo.endsWith(".txt")) return "text/plain";
    return "application/octet-stream";
  }

  private boolean firmaCoerente(Path file, String mime) throws IOException {
    var bytes = Files.readAllBytes(file);
    if ("application/pdf".equals(mime)) return inizia(bytes, "%PDF-".getBytes());
    if ("image/png".equals(mime)) return bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47;
    if ("image/jpeg".equals(mime)) return bytes.length >= 3 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff;
    if (mime.contains("openxmlformats")) return bytes.length >= 4 && bytes[0] == 0x50 && bytes[1] == 0x4b;
    return "text/plain".equals(mime);
  }

  private boolean inizia(byte[] valore, byte[] prefisso) {
    if (valore.length < prefisso.length) return false;
    for (int i = 0; i < prefisso.length; i++) if (valore[i] != prefisso[i]) return false;
    return true;
  }

  private String checksum(Path file) throws IOException, NoSuchAlgorithmException {
    var digest = MessageDigest.getInstance("SHA-256");
    digest.update(Files.readAllBytes(file));
    return HexFormat.of().formatHex(digest.digest());
  }

  public record DocumentoSalvato(String nomeFile, String mimeType, long dimensione, String percorso, String checksum) {}
}
