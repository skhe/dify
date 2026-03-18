# Human Input Text Entry 技术交接说明

## 背景

本文档用于交接提交 `76c71a3d1d7166e070102c21ab2bef04d610c1f1` 的前端实现。

该提交解决的问题是：

- `Human Input / Human in the Loop` 节点虽然前后端 schema 已支持 `inputs`
- 但作者在编辑节点时几乎只能感知到 `user_actions`（按钮分支）
- `text-input` 运行时渲染也未打通

因此用户感知会变成：

- “这个节点只能选按钮，不支持真正输入文本”

这次改动的目标是把“输入字段”从隐藏能力变成可见、可配置、可运行的能力。

---

## 结果概览

提交后，`Human Input` 节点具备了以下能力：

1. 右侧节点配置面板新增显式 `Input Field` 入口
2. 新建输入字段后，自动把对应占位符写入 `form_content`
3. 新增/编辑输入字段时，阻止重复变量名
4. 运行时表单支持 `text-input`
5. 既支持旧的 `paragraph`，也支持新的 `text-input`

---

## 一句话设计

这次实现没有改 Human Input 的后端基础协议，而是：

- **在前端配置层显式暴露 input field 创建入口**
- **把输入字段与 `form_content` 占位符同步维护**
- **在运行时表单里补齐 `text-input` 的渲染**

也就是说，这是一次“把已有 schema 能力真正打通到 UI/运行时”的改动，而不是从零引入新协议。

---

## 流程图

```mermaid
flowchart TD
    A[用户选中 Human Input 节点] --> B[右侧面板点击 Input Field]
    B --> C[打开 AddInputField / InputField 弹窗]
    C --> D{变量名合法且不重复?}
    D -- 否 --> E[阻止保存并展示错误]
    D -- 是 --> F[保存 FormInputItem]
    F --> G[useFormContent.handleFormInputItemAdd]
    G --> H[写入 inputs 列表]
    G --> I[若 form_content 中不存在占位符<br/>自动追加 {{#$output.var#}}]
    H --> J[重新渲染编辑器]
    I --> J
    J --> K[节点输出变量区显示新字段]
    K --> L[运行 / Run this step / 真实表单页]
    L --> M{运行时字段类型}
    M -- text-input --> N[渲染单行 Input]
    M -- paragraph --> O[渲染多行 Textarea]
    N --> P[用户输入文本]
    O --> P
    P --> Q[提交 inputs + action]
```

---

## 改动拆解

## 1) 节点面板：显式新增 `Input Field` 入口

文件：

- `web/app/components/workflow/nodes/human-input/panel.tsx`

改动前：

- `Form Content` 区域只有预览/复制/展开等操作
- 插入输入字段主要依赖编辑器内快捷键

改动后：

- `Form Content` 区域新增可见的 `Input Field` 按钮
- 点击后打开 `AddInputField`
- 该 modal 会把现有变量名传进去做去重校验

这部分让能力从“隐藏快捷键”升级成“右侧面板显式操作”。  

---

## 2) 输入字段与 `form_content` 的同步维护

文件：

- `web/app/components/workflow/nodes/human-input/hooks/use-form-content.ts`

这里新增了两个核心 helper：

- `getFormInputReference(variableName)`
- `appendFormInputReference(content, variableName)`

### 新增字段时

`handleFormInputItemAdd` 会：

1. 把新字段加入 `inputs`
2. 检查 `form_content` 是否已包含 `{{#$output.<name>#}}`
3. 若没有，则自动在 `form_content` 尾部追加该占位符

这样做的好处是：

- 用户新增字段后，不需要再手动把占位符插回编辑器
- 运行时表单一定能看到这个字段

### 重命名字段时

`handleFormInputItemRename` 会同步：

- 替换 `form_content` 中的旧占位符
- 更新 `inputs`
- 通知下游引用变量改名

### 删除字段时

`handleFormInputItemRemove` 会同步：

- 从 `form_content` 中移除对应占位符
- 从 `inputs` 中删掉对应字段

这部分是整次实现里最核心的“配置数据一致性”逻辑。

---

## 3) 输入字段弹窗：阻止重名

文件：

- `web/app/components/base/prompt-editor/plugins/hitl-input-block/input-field.tsx`
- `web/app/components/workflow/nodes/human-input/components/add-input-field.tsx`
- `web/app/components/base/prompt-editor/plugins/hitl-input-block/component.tsx`
- `web/app/components/base/prompt-editor/plugins/hitl-input-block/component-ui.tsx`

### 新增能力

`InputField` 增加了：

- `existingNames?: string[]`
- `nameDuplicated`
- `canSave = nameValid && !nameDuplicated`

行为：

- 新建时若变量名与现有字段重复，则禁止保存
- 编辑时允许保留原名，但改成别人的名字会被拦截

### 为什么要同时改这几处

因为 Human Input 的输入字段有两种入口：

1. 新增按钮打开的 `AddInputField`
2. 编辑器内已有 block 的编辑弹窗

两边都要把 `existingNames` 传进来，否则会出现：

- 面板新增时能防重
- 但 block 编辑时仍可能改出重复名

---

## 4) 运行时表单：补齐 `text-input` 渲染

文件：

- `web/app/components/base/chat/chat/answer/human-input-content/content-item.tsx`

这是最终用户最能感知到的改动。

改动前：

- 只有 `paragraph` 会被渲染为 `Textarea`
- `text-input` 虽然存在于 schema 中，但前端运行时不显示

改动后：

- `text-input` -> `Input`
- `paragraph` -> `Textarea`

因此 Human Input 节点现在运行时能同时支持：

- 单行文本输入
- 多行文本输入

这就是“只支持选择，不支持输入”被真正修掉的地方。

---

## 5) 文案补齐

文件：

- `web/i18n/en-US/workflow.json`

新增文案：

- `nodes.humanInput.formContent.addInputField`
- `nodes.humanInput.insertInputField.variableNameDuplicated`

分别用于：

- 面板上的显式按钮
- 重名变量提示

---

## 当前支持范围

这次提交后，`Human Input` 节点前端运行时实际支持：

- `text-input`
- `paragraph`

这里要注意：

- 它不是 Start/User Input 那种多类型输入节点
- 仍然只是 Human Input 场景下的文本表单能力补齐

---

## 设计取舍

### 为什么没有新增更多输入类型

这次提交只解决“文本输入打通”：

- `text-input`
- `paragraph`

原因是后端 `FormInputType` 当前也只定义了这两种能力。  
如果前端继续扩展成 `select / checkbox / json / file` 等，会立刻和后端协议脱节。

### 为什么要自动追加占位符

如果只新增 `inputs` 而不改 `form_content`：

- 运行时仍然不会展示字段
- 用户会继续觉得“加了输入但没显示”

所以这次实现选择强一致：

- 新增字段 -> 自动补 `form_content`

---

## 已知限制

### 1. 新建字段默认仍是 `paragraph`

`InputField` 的默认 payload 仍然是：

- `type: InputVarType.paragraph`

也就是说：

- 当前 UI 虽然支持运行时渲染 `text-input`
- 但新建字段的默认类型仍是多行文本

如果后续要让用户显式选择“短文本 / 长文本”，需要在这个弹窗里再加类型选择器。

### 2. Preview 不等于真实运行时

`Form Content Preview` 更多是 Markdown + action button 的内容预览。

它不是完整的运行时表单仿真器，所以：

- 有些输入显示能力仍应以 `Run this step` / 真实表单页为准

### 3. 仍然依赖 `form_content` 占位符

运行时是否渲染字段，取决于：

- `form_content` 中是否存在 `{{#$output.var#}}`

因此这套设计本质仍然是：

- “字段配置” + “占位符驱动渲染”

不是一个独立的字段列表渲染区。

---

## 后续前端可继续做的增强

### 1. 给输入字段选择类型

在 `InputField` 弹窗里增加类型切换：

- `text-input`
- `paragraph`

这样用户新增字段时能直接决定是短文本还是长文本。

### 2. 提升 Preview 的真实性

可以考虑让 `Form Content Preview` 直接复用 `ContentItem`：

- 让预览中也显示真实输入框
- 而不是只展示文本与按钮

### 3. 支持更多 Human Input 输入类型

如果后端以后扩展 `FormInputType`：

- select
- checkbox
- json object

那么前端主要扩展点仍然是：

- `content-item.tsx`
- `InputField` 配置弹窗
- `use-form-content` 的一致性维护

---

## 相关文件清单

本提交涉及的主要文件：

- `web/app/components/workflow/nodes/human-input/panel.tsx`
- `web/app/components/workflow/nodes/human-input/hooks/use-form-content.ts`
- `web/app/components/workflow/nodes/human-input/hooks/use-form-content.spec.ts`
- `web/app/components/workflow/nodes/human-input/components/add-input-field.tsx`
- `web/app/components/base/prompt-editor/plugins/hitl-input-block/input-field.tsx`
- `web/app/components/base/prompt-editor/plugins/hitl-input-block/component.tsx`
- `web/app/components/base/prompt-editor/plugins/hitl-input-block/component-ui.tsx`
- `web/app/components/base/chat/chat/answer/human-input-content/content-item.tsx`
- `web/app/components/base/chat/chat/answer/human-input-content/__tests__/content-item.spec.tsx`
- `web/app/components/base/prompt-editor/plugins/hitl-input-block/__tests__/input-field.spec.tsx`
- `web/i18n/en-US/workflow.json`

---

## 一句话总结

`76c71a3d1d7166e070102c21ab2bef04d610c1f1` 这次改动，本质上是把 Human Input 节点**原本已经部分存在但未真正可用的文本输入能力**，通过“显式新增入口 + 占位符自动同步 + 运行时 `text-input` 渲染 + 变量重名防护”完整打通成一个前端可感知、可配置、可运行的功能闭环。
