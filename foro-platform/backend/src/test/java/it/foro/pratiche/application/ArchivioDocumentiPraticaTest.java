package it.foro.pratiche.application;

import static org.assertj.core.api.Assertions.*;

import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class ArchivioDocumentiPraticaTest {
  @TempDir Path directory;
  @Test void salvaELeggePdfConNomeStorageCasuale() {
    var archivio=new ArchivioDocumentiPratica(directory.toString());
    var salvato=archivio.salva(UUID.randomUUID(),UUID.randomUUID(),new MockMultipartFile("file","atto.pdf","application/pdf","%PDF-1.7 demo".getBytes()));
    assertThat(salvato.mimeType()).isEqualTo("application/pdf");
    assertThat(archivio.leggi(salvato.percorso())).startsWith("%PDF-".getBytes());
    assertThat(salvato.percorso()).doesNotContain("atto.pdf");
  }
  @Test void rifiutaNomeConPathTraversal() {
    var archivio=new ArchivioDocumentiPratica(directory.toString());
    assertThatThrownBy(()->archivio.salva(UUID.randomUUID(),UUID.randomUUID(),new MockMultipartFile("file","../atto.pdf","application/pdf","%PDF-x".getBytes())))
      .isInstanceOf(IllegalArgumentException.class).hasMessage("PRATICA_DOCUMENTO_NON_VALIDO");
  }
  @Test void rifiutaFirmaMimeIncoerente() {
    var archivio=new ArchivioDocumentiPratica(directory.toString());
    assertThatThrownBy(()->archivio.salva(UUID.randomUUID(),UUID.randomUUID(),new MockMultipartFile("file","atto.pdf","application/pdf","non pdf".getBytes())))
      .isInstanceOf(IllegalArgumentException.class).hasMessage("PRATICA_DOCUMENTO_TIPO_NON_AMMESSO");
  }
  @Test void rifiutaFileVuoto() {
    var archivio=new ArchivioDocumentiPratica(directory.toString());
    assertThatThrownBy(()->archivio.salva(UUID.randomUUID(),UUID.randomUUID(),new MockMultipartFile("file","atto.pdf","application/pdf",new byte[0])))
      .hasMessage("PRATICA_DOCUMENTO_NON_VALIDO");
  }
  @Test void salvaDocumentoGeneratoConChecksumEStoragePrivato() {
    var archivio=new ArchivioDocumentiPratica(directory.toString());
    var contenuto="Scheda riepilogativa pratica".getBytes(StandardCharsets.UTF_8);
    var salvato=archivio.salvaGenerato(UUID.randomUUID(),UUID.randomUUID(),"scheda.txt",contenuto,"text/plain");
    assertThat(salvato.nomeFile()).isEqualTo("scheda.txt");
    assertThat(salvato.mimeType()).isEqualTo("text/plain");
    assertThat(salvato.checksum()).hasSize(64);
    assertThat(archivio.leggi(salvato.percorso())).isEqualTo(contenuto);
    assertThat(salvato.percorso()).doesNotContain("scheda.txt");
  }
  @Test void documentoGeneratoRifiutaPathTraversal() {
    var archivio=new ArchivioDocumentiPratica(directory.toString());
    assertThatThrownBy(()->archivio.salvaGenerato(UUID.randomUUID(),UUID.randomUUID(),"../scheda.txt","x".getBytes(),"text/plain"))
      .isInstanceOf(IllegalArgumentException.class).hasMessage("PRATICA_DOCUMENTO_NON_VALIDO");
  }
}
