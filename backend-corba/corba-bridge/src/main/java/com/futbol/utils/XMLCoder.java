package com.futbol.utils;

import BufferApp.NewsItem;

/**
 * Clase XMLCoder completa: Incluye todos los campos para validación total.
 */
public class XMLCoder {

    public static String toXML(NewsItem noticia) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<noticia>\n");
        xml.append("    <id>").append(escapeXML(noticia.id)).append("</id>\n");
        xml.append("    <date>").append(escapeXML(noticia.date)).append("</date>\n");
        xml.append("    <title>").append(escapeXML(noticia.title)).append("</title>\n");
        xml.append("    <author>").append(escapeXML(noticia.author)).append("</author>\n");
        xml.append("    <summary>").append(escapeXML(noticia.summary)).append("</summary>\n");
        xml.append("    <content>").append(escapeXML(noticia.content)).append("</content>\n");
        xml.append("    <imageUrl>").append(escapeXML(noticia.imageUrl)).append("</imageUrl>\n");
        xml.append("    <category>").append(escapeXML(noticia.category)).append("</category>\n");
        xml.append("    <isActive>").append(noticia.isActive).append("</isActive>\n");
        xml.append("    <isFeatured>").append(noticia.isFeatured).append("</isFeatured>\n");
        
        xml.append("    <tags>\n");
        if (noticia.tags != null) {
            for (String t : noticia.tags) {
                xml.append("        <tag>").append(escapeXML(t)).append("</tag>\n");
            }
        }
        xml.append("    </tags>\n");
        xml.append("    <createdBy>").append(escapeXML(noticia.createdBy)).append("</createdBy>\n");
        xml.append("    <updatedBy>").append(escapeXML(noticia.updatedBy)).append("</updatedBy>\n");
        xml.append("    <createdAt>").append(escapeXML(noticia.createdAt)).append("</createdAt>\n");
        xml.append("    <updatedAt>").append(escapeXML(noticia.updatedAt)).append("</updatedAt>\n");
        xml.append("</noticia>");
        
        return xml.toString();
    }

    private static String escapeXML(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&apos;");
    }
}
