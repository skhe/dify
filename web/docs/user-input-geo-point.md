# User Input Location / Geo Point 技术交接说明

## 背景

`User Input`（Start 节点）新增了一个前端语义类型：`geo_point`。

这个类型的目标是给工作流一个“经纬度输入”能力，但**不新增后端专用基础类型**，而是复用现有 `object / json schema` 能力完成数据流转。

换句话说：

- UI 上它是一个独立类型：`Geo Point`
- 运行时值是一个对象：`{ latitude: number, longitude: number }`
- 下游节点把它当普通对象变量使用

这是一个“语义类型 + 复用对象能力”的实现，而不是一套新的底层变量系统。

---

## 总体设计

### 1. 类型层

在前端 `InputVarType` 中新增：

- `geoPoint = 'geo_point'`

对应位置：

- `web/app/components/workflow/types.ts`

这个类型目前只在 `User Input` 场景中显式开放，不是全局所有输入节点都可选。

### 2. 底层数据结构

`geo_point` 运行时值统一使用对象：

- `latitude`
- `longitude`

固定 schema 定义在：

- `web/app/components/workflow/utils/geo-point.ts`

```ts
{
  type: 'object',
  properties: {
    latitude: { type: 'number' },
    longitude: { type: 'number' },
  },
  required: ['latitude', 'longitude'],
  additionalProperties: false,
}
```

因此：

- 前端变量类型映射到 `VarType.object`
- 后续节点读取时按对象处理
- 不需要新增后端 location 专用枚举

---

## 为什么这样实现

这次实现刻意没有把 location 做成一个新的后端基础类型，原因有两个：

1. 现有工作流变量系统已经支持 `json_object -> object`
2. 新增纯前端语义类型的改动面更小，兼容成本更低

这样做的结果是：

- 用户体验是独立的 `Geo Point`
- 系统内部复用对象通路
- DSL / draft payload 中仍然能携带固定的 `json_schema`

---

## 关键实现点

## 1) 共享 helper

文件：

- `web/app/components/workflow/utils/geo-point.ts`

职责：

- 固定 schema：`GEO_POINT_SCHEMA`
- 本地值标准化：`normalizeGeoPointValue`
- 空值判断：`isGeoPointEmpty`
- 最终提交解析：`parseGeoPointValue`

约束：

- `latitude` 范围：`[-90, 90]`
- `longitude` 范围：`[-180, 180]`
- 提交时统一转成数字

注意：

- 表单内部编辑态允许字符串
- 真正提交前才做 number 转换和范围校验

---

## 2) 配置弹窗

文件：

- `web/app/components/app/configuration/config-var/config-modal/index.tsx`

职责：

- 在类型下拉里新增 `Geo Point`
- 仅通过 `supportGeoPoint` 开关暴露
- 选择 `Geo Point` 时自动写入固定 schema
- 不展示 JSON Schema 编辑器
- 默认值不是 JSON 文本，而是两个数字输入框

关键行为：

1. `handleTypeChange`
   - 把类型切到 `geo_point`
   - 自动注入 `GEO_POINT_SCHEMA`
   - 清空原默认值

2. `handleConfirm`
   - 若经纬度默认值非空，则调用 `parseGeoPointValue`
   - 非法时提示 `invalidGeoPointDefault`
   - 合法时保存

这意味着：

- `geo_point` 的 schema 是系统固定的
- 用户不能把它编辑成任意 object

---

## 3) Start 节点开放入口

文件：

- `web/app/components/workflow/nodes/start/panel.tsx`
- `web/app/components/workflow/nodes/start/components/var-item.tsx`

处理方式：

- Start 节点新增变量时，给 `ConfigVarModal` 传 `supportGeoPoint`
- Start 节点编辑已有变量时，同样传 `supportGeoPoint`

目前只有这里显式开启，所以这项能力是：

- **Start / User Input 节点可用**
- 不是所有配置变量弹窗默认都可用

---

## 4) 输入控件

文件：

- `web/app/components/workflow/nodes/_base/components/geo-point-input.tsx`

职责：

- 渲染两个并排输入框
  - `Latitude`
  - `Longitude`
- 输出本地对象值

设计细节：

- 输入态保留字符串，避免用户输入中间状态被强转
- `autoFocus` 只落在纬度输入框

---

## 5) 工作流调试表单

文件：

- `web/app/components/workflow/nodes/_base/components/before-run-form/form-item.tsx`
- `web/app/components/workflow/nodes/_base/components/before-run-form/index.tsx`
- `web/app/components/workflow/nodes/_base/components/before-run-form/form.tsx`

职责：

- 在 Workflow `Test Run` / 单步运行表单里渲染 `geo_point`
- 提交前做校验和解析

处理方式：

### 渲染

`form-item.tsx` 中新增：

- `type === InputVarType.geoPoint`
- 使用 `GeoPointInput`

### 提交

`before-run-form/index.tsx` 中：

- 必填时，空经纬度会被视为未填写
- 非空时走 `parseGeoPointValue`
- 成功后提交为：

```ts
{
  latitude: number,
  longitude: number,
}
```

### 可选值

如果字段不是 required，且两项都为空：

- 提交为 `undefined`

---

## 6) 已发布 WebApp / Chat 输入表单

文件：

- `web/app/components/base/chat/embedded-chatbot/inputs-form/content.tsx`
- `web/app/components/base/chat/chat-with-history/inputs-form/content.tsx`
- `web/app/components/base/chat/chat/utils.ts`

职责：

- 已发布应用的输入表单中也支持 `geo_point`
- 避免只在 workflow 调试面板可用

处理方式：

- 输入表单里新增 `form.type === InputVarType.geoPoint` 分支
- 使用同一个 `GeoPointInput`
- `getProcessedInputs` 遇到 `geo_point` 时保留对象值直接向后传

这样调试表单和已发布表单共享一套输入 UI。

---

## 7) 类型与状态兼容

文件：

- `web/app/components/workflow/store/workflow/form-slice.ts`
- `web/app/components/workflow/panel/inputs-panel.tsx`
- `web/app/components/workflow/panel/debug-and-preview/chat-wrapper.tsx`
- `web/models/debug.ts`
- `web/service/workflow-payload.ts`

这里主要是为对象值打通前端状态链路：

1. workflow 本地输入状态允许 `object`
2. `PromptVariable.default` 允许对象默认值
3. workflow payload 在读写 draft 时，对 `geo_point` 的 `json_schema` 做和 `json_object` 一样的 string/object 归一化

注意：

- 这只是前端状态兼容
- 没有引入新的后端 location 协议

---

## 当前约束 / 已知限制

### 1. 只支持 Start 节点显式创建

目前 `supportGeoPoint` 只从 Start 节点传入配置弹窗。

如果后续要让别的地方也能创建 `geo_point`：

- 需要在对应入口传 `supportGeoPoint`

### 2. 下游没有“location 专用类型”

下游只会看到：

- `VarType.object`

所以模板、代码、HTTP 请求等地方要按对象读：

- `location.latitude`
- `location.longitude`

而不是按单独的“地理坐标”原生类型处理。

### 3. 目前没有地图控件

输入控件只是两个数字框，不包含：

- 地图选点
- GPS 自动定位
- 坐标系切换

如果后面需要增强，这个组件是最自然的扩展点。

---

## 推荐扩展方向

如果后续要继续迭代，建议顺序如下：

1. **UI 增强**
   - 更明确的范围提示
   - 经纬度说明文案
   - 经纬度 placeholder 示例

2. **对象 schema 扩展**
   - 支持 `altitude`
   - 支持 `address`
   - 支持坐标系字段

3. **专用展示**
   - 在变量展示区把对象显示成 `lat, lng`
   - 在结果面板中做 location 格式化显示

4. **交互增强**
   - 地图选点
   - 浏览器定位

---

## 修改文件清单

核心实现：

- `web/app/components/workflow/types.ts`
- `web/app/components/workflow/utils/geo-point.ts`
- `web/app/components/workflow/nodes/_base/components/geo-point-input.tsx`
- `web/app/components/app/configuration/config-var/config-modal/index.tsx`
- `web/app/components/workflow/nodes/start/panel.tsx`
- `web/app/components/workflow/nodes/start/components/var-item.tsx`
- `web/app/components/workflow/nodes/_base/components/before-run-form/form-item.tsx`
- `web/app/components/workflow/nodes/_base/components/before-run-form/index.tsx`
- `web/app/components/base/chat/embedded-chatbot/inputs-form/content.tsx`
- `web/app/components/base/chat/chat-with-history/inputs-form/content.tsx`
- `web/app/components/base/chat/chat/utils.ts`
- `web/service/workflow-payload.ts`

类型/兼容：

- `web/app/components/workflow/store/workflow/form-slice.ts`
- `web/app/components/workflow/panel/inputs-panel.tsx`
- `web/app/components/workflow/panel/debug-and-preview/chat-wrapper.tsx`
- `web/models/debug.ts`

文案：

- `web/i18n/en-US/app-debug.json`
- `web/i18n/en-US/workflow.json`

测试：

- `web/app/components/workflow/utils/__tests__/geo-point.spec.ts`
- `web/app/components/workflow/nodes/_base/components/geo-point-input.spec.tsx`
- `web/app/components/app/configuration/config-var/config-modal/index.spec.tsx`

---

## 一句话总结

当前的 `location / User Input Location` 实现，是一个 **只在 Start/User Input 暴露的 `geo_point` 语义类型**，**底层复用 object + fixed json schema**，运行表单统一渲染成 `Latitude / Longitude` 双数字输入框，提交时再解析为：

```ts
{ latitude: number, longitude: number }
```
