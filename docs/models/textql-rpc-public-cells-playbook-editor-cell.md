# TextqlRpcPublicCellsPlaybookEditorCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsPlaybookEditorCell } from "textql-sdk/models";

let value: TextqlRpcPublicCellsPlaybookEditorCell = {
  playbooks: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      datasets: [
        {
          tabularFile: {},
          createdAt: new Date("2023-01-15T01:30:15.01Z"),
          updatedAt: new Date("2023-01-15T01:30:15.01Z"),
          expiresAt: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
    },
  ],
};
```

## Fields

| Field                                                                                                          | Type                                                                                                           | Required                                                                                                       | Description                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `action`                                                                                                       | [models.TextqlRpcPublicCellsPlaybookEditorAction](../models/textql-rpc-public-cells-playbook-editor-action.md) | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `playbooks`                                                                                                    | [models.TextqlRpcPublicCellsPlaybookInfo](../models/textql-rpc-public-cells-playbook-info.md)[]                | :heavy_minus_sign:                                                                                             | results                                                                                                        |
| `errorMessage`                                                                                                 | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `totalCount`                                                                                                   | *number*                                                                                                       | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `slackChannels`                                                                                                | [models.TextqlRpcPublicCellsSlackChannelRef](../models/textql-rpc-public-cells-slack-channel-ref.md)[]         | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `slackUsers`                                                                                                   | [models.TextqlRpcPublicCellsSlackUserRef](../models/textql-rpc-public-cells-slack-user-ref.md)[]               | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `connectors`                                                                                                   | [models.TextqlRpcPublicCellsConnectorRef](../models/textql-rpc-public-cells-connector-ref.md)[]                | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `orgMembers`                                                                                                   | [models.TextqlRpcPublicCellsOrgMemberRef](../models/textql-rpc-public-cells-org-member-ref.md)[]               | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `hasSlack`                                                                                                     | *boolean*                                                                                                      | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `fieldChanges`                                                                                                 | [models.TextqlRpcPublicCellsFieldChange](../models/textql-rpc-public-cells-field-change.md)[]                  | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `teamsChannels`                                                                                                | [models.TextqlRpcPublicCellsTeamsChannelRef](../models/textql-rpc-public-cells-teams-channel-ref.md)[]         | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `teamsUsers`                                                                                                   | [models.TextqlRpcPublicCellsTeamsUserRef](../models/textql-rpc-public-cells-teams-user-ref.md)[]               | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `hasTeams`                                                                                                     | *boolean*                                                                                                      | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |