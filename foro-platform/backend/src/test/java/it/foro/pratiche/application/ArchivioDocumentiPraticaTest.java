package it.foro.pratiche.application;

import static org.assertj.core.api.Assertions.*;

import java.nio.file.Path;
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
}
