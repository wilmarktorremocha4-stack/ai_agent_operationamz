import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', padding: 40, fontFamily: 'Helvetica' },
  header: { backgroundColor: '#030A18', padding: 20, marginBottom: 24, borderRadius: 4 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: 700 },
  subtitle: { color: '#1DBBEE', fontSize: 11, marginTop: 6 },
  accentBar: { height: 3, backgroundColor: '#0E90C8', marginBottom: 20, width: 60 },
  sectionHeading: { fontSize: 14, fontWeight: 700, color: '#0E90C8', marginTop: 16, marginBottom: 6 },
  body: { fontSize: 11, lineHeight: 1.6, color: '#1a1a1a' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9aa',
    textAlign: 'center',
    borderTop: '1 solid #e0e0e0',
    paddingTop: 8,
  },
});

export function NavigatorDocumentPDF({
  title,
  content,
  summary,
}: {
  title: string;
  content: string;
  summary?: string;
}) {
  return (
    <Document
      title={title}
      author="AMZ Navigator"
      creator="AMZ Navigator — operationamz.com"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {summary && <Text style={styles.subtitle}>{summary}</Text>}
        </View>
        <View style={styles.accentBar} />
        <Text style={styles.body}>{content}</Text>
        <Text style={styles.footer} fixed>
          Prepared by AMZ Navigator — operationamz.com
        </Text>
      </Page>
    </Document>
  );
}
