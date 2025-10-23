"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  TextArea,
  Badge,
  Spinner,
  Separator,
} from "@radix-ui/themes";
import type { CourseModule, LearningOutcome, ModuleTool } from "@/lib/types";
import styles from "./GeneralReportSettings.module.css";

interface GeneralReportSettingsProps {
  reportId: string;
  initialTitle: string;
  initialDescription?: string;
  structureData?: any[]; // Structure data from report
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
}

export function GeneralReportSettings({
  reportId,
  initialTitle,
  initialDescription,
  structureData,
  onTitleChange,
  onDescriptionChange,
}: GeneralReportSettingsProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");
  const [courseStructure, setCourseStructure] = useState<CourseModule[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<
    Record<number, LearningOutcome>
  >({});
  const [moduleTools, setModuleTools] = useState<Record<number, ModuleTool>>(
    {},
  );
  const [loadingStructure, setLoadingStructure] = useState(true);
  const [loadingOutcomes, setLoadingOutcomes] = useState(true);
  const [loadingTools, setLoadingTools] = useState(true);
  const [generatingModuleId, setGeneratingModuleId] = useState<number | null>(
    null,
  );
  const [generatingToolsModuleId, setGeneratingToolsModuleId] = useState<
    number | null
  >(null);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingToolsModuleId, setEditingToolsModuleId] = useState<
    number | null
  >(null);
  const [editText, setEditText] = useState("");
  const [editToolsText, setEditToolsText] = useState("");
  const [savingModuleId, setSavingModuleId] = useState<number | null>(null);
  const [savingToolsModuleId, setSavingToolsModuleId] = useState<
    number | null
  >(null);
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(
    null,
  );
  const [deletingToolsModuleId, setDeletingToolsModuleId] = useState<
    number | null
  >(null);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [metadataChanged, setMetadataChanged] = useState(false);

  // Load course structure from structure_data
  useEffect(() => {
    async function buildCourseStructure() {
      setLoadingStructure(true);
      setStructureError(null);

      if (!structureData || structureData.length === 0) {
        setLoadingStructure(false);
        setCourseStructure([]);
        return;
      }

      try {
        const response = await fetch("/api/cogniterra/course-structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ structureData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to build course structure",
          );
        }

        const data = await response.json();
        // Ensure we always set an array, never undefined
        setCourseStructure(
          Array.isArray(data.courseStructure) ? data.courseStructure : [],
        );
      } catch (error: any) {
        console.error("Error building course structure:", error);
        setStructureError(error.message || "Failed to load course structure");
        setCourseStructure([]); // Set empty array on error
      } finally {
        setLoadingStructure(false);
      }
    }

    buildCourseStructure();
  }, [structureData]);

  // Load existing learning outcomes
  useEffect(() => {
    async function fetchLearningOutcomes() {
      try {
        const response = await fetch(
          `/api/reports/learning-outcomes?reportId=${reportId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch learning outcomes");
        }
        const data = await response.json();
        const outcomesMap: Record<number, LearningOutcome> = {};
        for (const outcome of data.learningOutcomes || []) {
          outcomesMap[outcome.module_id] = outcome;
        }
        setLearningOutcomes(outcomesMap);
      } catch (error) {
        console.error("Error fetching learning outcomes:", error);
      } finally {
        setLoadingOutcomes(false);
      }
    }

    fetchLearningOutcomes();
  }, [reportId]);

  // Load existing module tools
  useEffect(() => {
    async function fetchModuleTools() {
      try {
        const response = await fetch(
          `/api/reports/module-tools?reportId=${reportId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch module tools");
        }
        const data = await response.json();
        const toolsMap: Record<number, ModuleTool> = {};
        for (const tool of data.moduleTools || []) {
          toolsMap[tool.module_id] = tool;
        }
        setModuleTools(toolsMap);
      } catch (error) {
        console.error("Error fetching module tools:", error);
      } finally {
        setLoadingTools(false);
      }
    }

    fetchModuleTools();
  }, [reportId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setMetadataChanged(true);
    if (onTitleChange) {
      onTitleChange(value);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setMetadataChanged(true);
    if (onDescriptionChange) {
      onDescriptionChange(value);
    }
  };

  const handleSaveMetadata = async () => {
    if (!title.trim()) {
      alert("Report title cannot be empty");
      return;
    }

    setSavingMetadata(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save report metadata");
      }

      setMetadataChanged(false);
      alert("Report metadata saved successfully!");
    } catch (error) {
      console.error("Error saving metadata:", error);
      alert("Failed to save metadata. Please try again.");
    } finally {
      setSavingMetadata(false);
    }
  };

  const handleGenerateLearningOutcomes = async (module: CourseModule) => {
    setGeneratingModuleId(module.moduleId);
    try {
      const response = await fetch("/api/llm/generate-learning-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseStructure,
          moduleId: module.moduleId,
          moduleTitle: module.moduleTitle,
          topics: module.topics,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate learning outcomes");
      }

      const data = await response.json();

      // Update local state with generated outcomes
      setLearningOutcomes((prev) => ({
        ...prev,
        [module.moduleId]: {
          id: "", // Will be set after saving
          report_id: reportId,
          module_id: module.moduleId,
          module_title: module.moduleTitle,
          outcomes: data.outcomes,
          created_by: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));

      // Auto-save to database
      await saveLearningOutcome(
        module.moduleId,
        module.moduleTitle,
        data.outcomes,
      );
    } catch (error) {
      console.error("Error generating learning outcomes:", error);
      alert("Failed to generate learning outcomes. Please try again.");
    } finally {
      setGeneratingModuleId(null);
    }
  };

  const saveLearningOutcome = async (
    moduleId: number,
    moduleTitle: string,
    outcomes: string,
  ) => {
    try {
      const response = await fetch("/api/reports/learning-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          moduleId,
          moduleTitle,
          outcomes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save learning outcome");
      }

      const data = await response.json();

      // Update with saved data
      setLearningOutcomes((prev) => ({
        ...prev,
        [moduleId]: data.learningOutcome,
      }));
    } catch (error) {
      console.error("Error saving learning outcome:", error);
      throw error;
    }
  };

  const handleEditStart = (moduleId: number) => {
    const outcome = learningOutcomes[moduleId];
    if (outcome) {
      setEditText(outcome.outcomes);
      setEditingModuleId(moduleId);
    }
  };

  const handleEditCancel = () => {
    setEditingModuleId(null);
    setEditText("");
  };

  const handleEditSave = async (module: CourseModule) => {
    setSavingModuleId(module.moduleId);
    try {
      await saveLearningOutcome(module.moduleId, module.moduleTitle, editText);
      setEditingModuleId(null);
      setEditText("");
    } catch (error) {
      alert("Failed to save changes. Please try again.");
    } finally {
      setSavingModuleId(null);
    }
  };

  // Tools generation and management functions
  const handleGenerateModuleTools = async (module: CourseModule) => {
    setGeneratingToolsModuleId(module.moduleId);
    try {
      const response = await fetch("/api/llm/generate-module-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseStructure,
          moduleId: module.moduleId,
          moduleTitle: module.moduleTitle,
          topics: module.topics,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate module tools");
      }

      const data = await response.json();

      // Update local state with generated tools
      setModuleTools((prev) => ({
        ...prev,
        [module.moduleId]: {
          id: "", // Will be set after saving
          report_id: reportId,
          module_id: module.moduleId,
          module_title: module.moduleTitle,
          tools: data.tools,
          created_by: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));

      // Auto-save to database
      await saveModuleTool(
        module.moduleId,
        module.moduleTitle,
        data.tools,
      );
    } catch (error) {
      console.error("Error generating module tools:", error);
      alert("Failed to generate module tools. Please try again.");
    } finally {
      setGeneratingToolsModuleId(null);
    }
  };

  const saveModuleTool = async (
    moduleId: number,
    moduleTitle: string,
    tools: string,
  ) => {
    try {
      const response = await fetch("/api/reports/module-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          moduleId,
          moduleTitle,
          tools,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save module tool");
      }

      const data = await response.json();

      // Update with saved data
      setModuleTools((prev) => ({
        ...prev,
        [moduleId]: data.moduleTool,
      }));
    } catch (error) {
      console.error("Error saving module tool:", error);
      throw error;
    }
  };

  const handleEditToolsStart = (moduleId: number) => {
    const tool = moduleTools[moduleId];
    if (tool) {
      setEditToolsText(tool.tools);
      setEditingToolsModuleId(moduleId);
    }
  };

  const handleEditToolsCancel = () => {
    setEditingToolsModuleId(null);
    setEditToolsText("");
  };

  const handleEditToolsSave = async (module: CourseModule) => {
    setSavingToolsModuleId(module.moduleId);
    try {
      await saveModuleTool(module.moduleId, module.moduleTitle, editToolsText);
      setEditingToolsModuleId(null);
      setEditToolsText("");
    } catch (error) {
      alert("Failed to save changes. Please try again.");
    } finally {
      setSavingToolsModuleId(null);
    }
  };

  const handleDeleteLearningOutcome = async (moduleId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete the learning outcomes for this module?",
      )
    ) {
      return;
    }

    setDeletingModuleId(moduleId);
    try {
      const response = await fetch(
        `/api/reports/learning-outcomes?reportId=${reportId}&moduleId=${moduleId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete learning outcome");
      }

      // Remove from local state
      setLearningOutcomes((prev) => {
        const updated = { ...prev };
        delete updated[moduleId];
        return updated;
      });
    } catch (error) {
      console.error("Error deleting learning outcome:", error);
      alert("Failed to delete learning outcome. Please try again.");
    } finally {
      setDeletingModuleId(null);
    }
  };

  const handleDeleteModuleTool = async (moduleId: number) => {
    if (
      !confirm("Are you sure you want to delete the tools for this module?")
    ) {
      return;
    }

    setDeletingToolsModuleId(moduleId);
    try {
      const response = await fetch(
        `/api/reports/module-tools?reportId=${reportId}&moduleId=${moduleId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete module tool");
      }

      // Remove from local state
      setModuleTools((prev) => {
        const updated = { ...prev };
        delete updated[moduleId];
        return updated;
      });
    } catch (error) {
      console.error("Error deleting module tool:", error);
      alert("Failed to delete module tool. Please try again.");
    } finally {
      setDeletingToolsModuleId(null);
    }
  };

  return (
    <Box className={styles.container}>
      <Card>
        <Flex direction="column" gap="4">
          <Box>
            <Heading size="5" mb="3">
              ⚙️ General Report Settings
            </Heading>
            <Text size="2" color="gray">
              Manage report metadata and define learning outcomes for each
              module
            </Text>
          </Box>

          <Separator size="4" />

          {/* Report Title and Description */}
          <Flex direction="column" gap="3">
            <Box>
              <Text as="div" size="2" mb="1" weight="bold">
                Report Title
              </Text>
              <TextField.Root
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter report title"
                size="3"
              />
            </Box>

            <Box>
              <Text as="div" size="2" mb="1" weight="bold">
                Report Description
              </Text>
              <TextArea
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Add a description for this report..."
                rows={3}
                size="3"
              />
            </Box>

            {metadataChanged && (
              <Flex justify="end">
                <Button
                  size="2"
                  onClick={handleSaveMetadata}
                  disabled={savingMetadata}
                >
                  {savingMetadata ? (
                    <>
                      <Spinner size="1" />
                      Saving...
                    </>
                  ) : (
                    "💾 Save Changes"
                  )}
                </Button>
              </Flex>
            )}
          </Flex>

          <Separator size="4" />

          {/* Learning Outcomes Section */}
          <Box>
            <Heading size="4" mb="2">
              📚 Learning Outcomes by Module
            </Heading>
            <Text size="2" color="gray" mb="4">
              Generate and customize learning outcomes for each module in the
              course
            </Text>

            {loadingStructure ? (
              <Flex align="center" justify="center" py="6">
                <Spinner size="3" />
                <Text ml="3" color="gray">
                  Loading course structure from Cogniterra API...
                </Text>
              </Flex>
            ) : structureError ? (
              <Card
                style={{
                  background: "var(--red-a3)",
                  border: "1px solid var(--red-a6)",
                }}
              >
                <Text size="2" color="red">
                  {structureError}
                </Text>
              </Card>
            ) : !structureData || structureData.length === 0 ? (
              <Card style={{ background: "var(--amber-a3)" }}>
                <Text size="2">
                  No structure data found. Please upload the structure CSV file
                  when creating the report.
                </Text>
              </Card>
            ) : !courseStructure || courseStructure.length === 0 ? (
              <Card style={{ background: "var(--amber-a3)" }}>
                <Text size="2">No modules found in the structure data.</Text>
              </Card>
            ) : (
              <Flex direction="column" gap="4">
                {courseStructure.map((module) => {
                  const outcome = learningOutcomes[module.moduleId];
                  const tool = moduleTools[module.moduleId];
                  const isGenerating = generatingModuleId === module.moduleId;
                  const isGeneratingTools =
                    generatingToolsModuleId === module.moduleId;
                  const isEditing = editingModuleId === module.moduleId;
                  const isEditingTools =
                    editingToolsModuleId === module.moduleId;
                  const isSaving = savingModuleId === module.moduleId;
                  const isSavingTools =
                    savingToolsModuleId === module.moduleId;
                  const isDeleting = deletingModuleId === module.moduleId;
                  const isDeletingTools =
                    deletingToolsModuleId === module.moduleId;

                  return (
                    <Card key={module.moduleId}>
                      <Flex direction="column" gap="3">
                        <Flex justify="between" align="start">
                          <Box style={{ flex: 1 }}>
                            <Flex align="center" gap="2" mb="2">
                              <Badge color="blue" size="2">
                                Module {module.modulePosition}
                              </Badge>
                              <Heading size="3">{module.moduleTitle}</Heading>
                            </Flex>
                            <Text size="2" color="gray">
                              {module.topics?.length || 0} topics
                            </Text>
                          </Box>

                          <Flex gap="2">
                            {!outcome && (
                              <Button
                                size="2"
                                onClick={() =>
                                  handleGenerateLearningOutcomes(module)
                                }
                                disabled={isGenerating}
                              >
                                {isGenerating ? (
                                  <>
                                    <Spinner size="1" />
                                    Generating...
                                  </>
                                ) : (
                                  "✨ Generate Learning Outcomes"
                                )}
                              </Button>
                            )}
                            {!tool && (
                              <Button
                                size="2"
                                variant="soft"
                                color="purple"
                                onClick={() => handleGenerateModuleTools(module)}
                                disabled={isGeneratingTools}
                              >
                                {isGeneratingTools ? (
                                  <>
                                    <Spinner size="1" />
                                    Generating...
                                  </>
                                ) : (
                                  "🔧 Generate Tools"
                                )}
                              </Button>
                            )}
                          </Flex>
                        </Flex>

                        {/* Topics List */}
                        {module.topics && module.topics.length > 0 && (
                          <Box className={styles.topicsList}>
                            <Text size="2" weight="bold" mb="2">
                              Topics covered:
                            </Text>
                            <Flex direction="column" gap="1">
                              {module.topics.map((topic) => (
                                <Text key={topic.topicId} size="2" color="gray">
                                  • {topic.topicTitle} ({topic.stepsCount}{" "}
                                  steps)
                                </Text>
                              ))}
                            </Flex>
                          </Box>
                        )}

                        {/* Learning Outcomes Display/Edit */}
                        {outcome && (
                          <Box className={styles.outcomesSection}>
                            <Flex justify="between" align="center" mb="2">
                              <Text size="2" weight="bold">
                                📚 Learning Outcomes:
                              </Text>
                              {!isEditing && (
                                <Flex gap="2">
                                  <Button
                                    size="1"
                                    variant="soft"
                                    onClick={() =>
                                      handleEditStart(module.moduleId)
                                    }
                                  >
                                    ✏️ Edit
                                  </Button>
                                  <Button
                                    size="1"
                                    variant="soft"
                                    color="red"
                                    onClick={() =>
                                      handleDeleteLearningOutcome(
                                        module.moduleId,
                                      )
                                    }
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? (
                                      <Spinner size="1" />
                                    ) : (
                                      "🗑️ Delete"
                                    )}
                                  </Button>
                                </Flex>
                              )}
                            </Flex>

                            {isEditing ? (
                              <Box>
                                <TextArea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={6}
                                  className={styles.editArea}
                                />
                                <Flex gap="2" mt="2" justify="end">
                                  <Button
                                    size="2"
                                    variant="soft"
                                    color="gray"
                                    onClick={handleEditCancel}
                                    disabled={isSaving}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="2"
                                    onClick={() => handleEditSave(module)}
                                    disabled={isSaving}
                                  >
                                    {isSaving ? (
                                      <>
                                        <Spinner size="1" />
                                        Saving...
                                      </>
                                    ) : (
                                      "Save Changes"
                                    )}
                                  </Button>
                                </Flex>
                              </Box>
                            ) : (
                              <Box className={styles.outcomesDisplay}>
                                <Text
                                  size="2"
                                  style={{ whiteSpace: "pre-wrap" }}
                                >
                                  {outcome.outcomes}
                                </Text>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Module Tools Display/Edit */}
                        {tool && (
                          <Box className={styles.outcomesSection}>
                            <Flex justify="between" align="center" mb="2">
                              <Text size="2" weight="bold">
                                🔧 Tools:
                              </Text>
                              {!isEditingTools && (
                                <Flex gap="2">
                                  <Button
                                    size="1"
                                    variant="soft"
                                    color="purple"
                                    onClick={() =>
                                      handleEditToolsStart(module.moduleId)
                                    }
                                  >
                                    ✏️ Edit
                                  </Button>
                                  <Button
                                    size="1"
                                    variant="soft"
                                    color="red"
                                    onClick={() =>
                                      handleDeleteModuleTool(module.moduleId)
                                    }
                                    disabled={isDeletingTools}
                                  >
                                    {isDeletingTools ? (
                                      <Spinner size="1" />
                                    ) : (
                                      "🗑️ Delete"
                                    )}
                                  </Button>
                                </Flex>
                              )}
                            </Flex>

                            {isEditingTools ? (
                              <Box>
                                <TextArea
                                  value={editToolsText}
                                  onChange={(e) =>
                                    setEditToolsText(e.target.value)
                                  }
                                  rows={6}
                                  className={styles.editArea}
                                />
                                <Flex gap="2" mt="2" justify="end">
                                  <Button
                                    size="2"
                                    variant="soft"
                                    color="gray"
                                    onClick={handleEditToolsCancel}
                                    disabled={isSavingTools}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="2"
                                    color="purple"
                                    onClick={() => handleEditToolsSave(module)}
                                    disabled={isSavingTools}
                                  >
                                    {isSavingTools ? (
                                      <>
                                        <Spinner size="1" />
                                        Saving...
                                      </>
                                    ) : (
                                      "Save Changes"
                                    )}
                                  </Button>
                                </Flex>
                              </Box>
                            ) : (
                              <Box className={styles.outcomesDisplay}>
                                <Text
                                  size="2"
                                  style={{ whiteSpace: "pre-wrap" }}
                                >
                                  {tool.tools}
                                </Text>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            )}
          </Box>
        </Flex>
      </Card>
    </Box>
  );
}
