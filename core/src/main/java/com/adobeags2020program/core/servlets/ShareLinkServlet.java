package com.adobeags2020program.core.servlets;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.servlet.Servlet;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(service = Servlet.class, property = { "sling.servlet.paths=/bin/customsharelinkservlet",
        "sling.servlet.methods=POST" })
public class ShareLinkServlet extends SlingAllMethodsServlet {

    /**
     * 
     */
    private static final long serialVersionUID = 33451L;
    private static Logger logger = LoggerFactory.getLogger(ShareLinkServlet.class);

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        String dataPath = request.getParameter("dataPath");
        String[] paths = request.getParameterValues("paths");
        String expirationDateStr = request.getParameter("expiryDateTime");
        String[] deletedPaths = request.getParameterValues("deletedPaths");
        String[] userEmails = request.getParameterValues("userEmails");
        logger.info("User Emails received: {}", Arrays.toString(userEmails));

        if (deletedPaths == null) {
            deletedPaths = new String[] {};
        }

        if (dataPath == null || dataPath.isEmpty()) {
            response.setStatus(SlingHttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("Data path is missing");
            return;
        }
        logger.info("Servlet trigerred =" + dataPath);
        ResourceResolver resourceResolver = request.getResourceResolver();
        Resource resource = resourceResolver.getResource(dataPath);

        if (resource == null) {
            response.setStatus(SlingHttpServletResponse.SC_NOT_FOUND);
            response.getWriter().write("Node not found");
            return;
        }

        ModifiableValueMap valueMap = resource.adaptTo(ModifiableValueMap.class);
        if (valueMap == null) {
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("Failed to adapt resource to ModifiableValueMap");
            return;
        }

        String[] pathProperty = valueMap.get("path", String[].class);
        if (pathProperty == null) {
            pathProperty = new String[] {};
        }

        if (paths == null) {
            paths = new String[] {};
        }

        // Append a dummy value to the array
        String[] updatedPathProperty = new String[pathProperty.length + paths.length];
        System.arraycopy(pathProperty, 0, updatedPathProperty, 0, pathProperty.length);
        System.arraycopy(paths, 0, updatedPathProperty, pathProperty.length, paths.length);

        // Update the node property
        List<String> currentPaths = new ArrayList<>(Arrays.asList(pathProperty));

        // Remove deleted paths
        for (String del : deletedPaths) {
            currentPaths.removeIf(p -> p.equals(del));
        }

        // Add new paths (if not duplicates)
        for (String newPath : paths) {
            if (!currentPaths.contains(newPath)) {
                currentPaths.add(newPath);
            }
        }

        // Update the node property
        valueMap.put("path", currentPaths.toArray(new String[0]));

        Set<String> updatedEmails = new HashSet<>();
        if (userEmails != null) {
            for (String email : userEmails) {
                if (email != null && !email.trim().isEmpty()) {
                    updatedEmails.add(email.trim());
                }
            }
        }

        valueMap.put("emails", updatedEmails.toArray(new String[0]));

        if (expirationDateStr != null && !expirationDateStr.isEmpty()) {
            try {
                OffsetDateTime offsetDateTime = OffsetDateTime.parse(expirationDateStr);
                Calendar calendar = GregorianCalendar.from(offsetDateTime.toZonedDateTime());
                valueMap.put("expirationDate", calendar);
                logger.info("Expiration date set to {}", calendar.getTime());
            } catch (Exception e) {
                logger.error("Failed to parse expirationDate: {}", expirationDateStr, e);
                response.setStatus(SlingHttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("Invalid expirationDate format. Expected ISO (e.g., 2025-08-04T10:30:00)");
                return;
            }
        }

        try {
            resourceResolver.commit();
            response.setStatus(SlingHttpServletResponse.SC_OK);
            response.getWriter().write("Value appended successfully");
        } catch (PersistenceException e) {
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("Failed to save changes: " + e.getMessage());
        }
    }
}
