import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  runApp(const GonitorMobileApp());
}

class GonitorMobileApp extends StatefulWidget {
  const GonitorMobileApp({super.key});

  @override
  State<GonitorMobileApp> createState() => _GonitorMobileAppState();
}

class _GonitorMobileAppState extends State<GonitorMobileApp> {
  late final GonitorAppController controller;

  @override
  void initState() {
    super.initState();
    controller = GonitorAppController();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Gonitor Mobile',
          theme: ThemeData(
            useMaterial3: true,
            colorSchemeSeed: const Color(0xFF2E6BFF),
            brightness: Brightness.light,
            scaffoldBackgroundColor: const Color(0xFFF5F7FB),
            cardTheme: const CardThemeData(
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(24)),
              ),
            ),
            inputDecorationTheme: const InputDecorationTheme(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(18)),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          home: controller.session == null
              ? LoginPage(controller: controller)
              : HomeShell(controller: controller),
        );
      },
    );
  }
}

class GonitorAppController extends ChangeNotifier {
  GonitorAppController() : _apiClient = GonitorApiClient();

  final GonitorApiClient _apiClient;

  AppSession? session;
  bool isBusy = false;
  bool isRefreshing = false;
  bool isDemoMode = false;
  String? errorMessage;
  int currentIndex = 0;

  DashboardBundle dashboard = DemoSeed.dashboard;
  List<TaskSummary> tasks = List<TaskSummary>.from(DemoSeed.tasks);
  List<NodeSummary> nodes = List<NodeSummary>.from(DemoSeed.nodes);
  List<UserSummary> users = List<UserSummary>.from(DemoSeed.users);
  List<OperationRecord> operations = List<OperationRecord>.from(DemoSeed.operations);
  TaskDetailBundle? selectedTaskDetail = DemoSeed.taskDetail;

  void useDemoMode() {
    session = const AppSession(
      baseUrl: 'https://demo.gonitor.local',
      token: 'demo-token',
      account: 'demo',
    );
    isDemoMode = true;
    errorMessage = null;
    dashboard = DemoSeed.dashboard;
    tasks = List<TaskSummary>.from(DemoSeed.tasks);
    nodes = List<NodeSummary>.from(DemoSeed.nodes);
    users = List<UserSummary>.from(DemoSeed.users);
    operations = List<OperationRecord>.from(DemoSeed.operations);
    selectedTaskDetail = DemoSeed.taskDetail;
    notifyListeners();
  }

  Future<void> login({
    required String baseUrl,
    required String account,
    required String password,
  }) async {
    isBusy = true;
    errorMessage = null;
    notifyListeners();
    try {
      final normalizedBaseUrl = _normalizeBaseUrl(baseUrl);
      final token = await _apiClient.login(
        baseUrl: normalizedBaseUrl,
        account: account,
        password: password,
      );
      session = AppSession(
        baseUrl: normalizedBaseUrl,
        token: token,
        account: account,
      );
      isDemoMode = false;
      await refreshAll();
    } catch (error) {
      errorMessage = error.toString().replaceFirst('Exception: ', '');
      rethrow;
    } finally {
      isBusy = false;
      notifyListeners();
    }
  }

  String _normalizeBaseUrl(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) {
      throw Exception('请输入 Gonitor 服务地址');
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed.replaceAll(RegExp(r'/+$'), '');
    }
    return 'http://${trimmed.replaceAll(RegExp(r'/+$'), '')}';
  }

  Future<void> refreshAll() async {
    if (session == null) return;
    if (isDemoMode) {
      notifyListeners();
      return;
    }
    isRefreshing = true;
    errorMessage = null;
    notifyListeners();
    try {
      final dashboardFuture = _loadDashboard();
      final tasksFuture = _apiClient.getTaskList(session!);
      final nodesFuture = _apiClient.getNodeList(session!);
      final usersFuture = _apiClient.getUserList(session!);
      final operationsFuture = _apiClient.getOperationList(session!);
      final results = await Future.wait<dynamic>([
        dashboardFuture,
        tasksFuture,
        nodesFuture,
        usersFuture,
        operationsFuture,
      ]);
      dashboard = results[0] as DashboardBundle;
      tasks = results[1] as List<TaskSummary>;
      nodes = results[2] as List<NodeSummary>;
      users = results[3] as List<UserSummary>;
      operations = results[4] as List<OperationRecord>;
      if (tasks.isNotEmpty) {
        final preservedId = selectedTaskDetail?.task.id;
        final nextId = tasks.any((task) => task.id == preservedId)
            ? preservedId!
            : tasks.first.id;
        selectedTaskDetail = await _apiClient.getTaskDetail(session!, nextId);
      } else {
        selectedTaskDetail = null;
      }
    } catch (error) {
      errorMessage = error.toString().replaceFirst('Exception: ', '');
    } finally {
      isRefreshing = false;
      notifyListeners();
    }
  }

  Future<DashboardBundle> _loadDashboard() async {
    final overviewFuture = _apiClient.getSystemOverview(session!);
    final cpuFuture = _apiClient.getCpu(session!);
    final memoryFuture = _apiClient.getMemory(session!);
    final diskFuture = _apiClient.getDisk(session!);
    final netFuture = _apiClient.getNet(session!);
    final settingsFuture = _apiClient.getSystemSettings(session!);
    final results = await Future.wait<dynamic>([
      overviewFuture,
      cpuFuture,
      memoryFuture,
      diskFuture,
      netFuture,
      settingsFuture,
    ]);
    return DashboardBundle(
      overview: results[0] as SystemOverview,
      cpu: results[1] as CpuSnapshot,
      memory: results[2] as MemorySnapshot,
      disk: results[3] as DiskSnapshot,
      network: results[4] as List<NetworkSnapshot>,
      settings: results[5] as SystemSettingsSnapshot,
    );
  }

  void selectTab(int index) {
    currentIndex = index;
    notifyListeners();
  }

  Future<void> selectTask(TaskSummary task) async {
    if (isDemoMode) {
      selectedTaskDetail = DemoSeed.taskDetail.copyWith(task: task);
      notifyListeners();
      return;
    }
    if (session == null) return;
    isBusy = true;
    notifyListeners();
    try {
      selectedTaskDetail = await _apiClient.getTaskDetail(session!, task.id);
    } catch (error) {
      errorMessage = error.toString().replaceFirst('Exception: ', '');
    } finally {
      isBusy = false;
      notifyListeners();
    }
  }

  Future<String> triggerTaskAction(TaskSummary task, TaskAction action) async {
    if (isDemoMode) {
      switch (action) {
        case TaskAction.start:
          tasks = tasks
              .map((item) => item.id == task.id ? item.copyWith(isDisabled: false) : item)
              .toList();
          final detail = selectedTaskDetail;
          if (detail != null) {
            selectedTaskDetail = detail.copyWith(
              task: detail.task.copyWith(isDisabled: false),
            );
          }
          notifyListeners();
          return 'Demo：任务已启用';
        case TaskAction.stop:
          tasks = tasks
              .map((item) => item.id == task.id ? item.copyWith(isDisabled: true) : item)
              .toList();
          final detail = selectedTaskDetail;
          if (detail != null) {
            selectedTaskDetail = detail.copyWith(
              task: detail.task.copyWith(isDisabled: true),
            );
          }
          notifyListeners();
          return 'Demo：任务已停用';
        case TaskAction.runOnce:
          return 'Demo：任务立即执行成功';
      }
    }
    if (session == null) {
      throw Exception('当前未登录');
    }
    final message = await _apiClient.triggerTaskAction(session!, task.id, action);
    await refreshAll();
    return message;
  }

  Future<String> regenerateNodeKey(NodeSummary node) async {
    if (isDemoMode) {
      return 'Demo：已为 ${node.name} 重新生成密钥';
    }
    if (session == null) {
      throw Exception('当前未登录');
    }
    final message = await _apiClient.regenerateNodeKey(session!, node.id);
    await refreshAll();
    return message;
  }

  Future<String> testPush() async {
    if (isDemoMode) {
      return 'Demo：移动端通知链路联调成功';
    }
    if (session == null) {
      throw Exception('当前未登录');
    }
    return _apiClient.testPush(session!);
  }

  void logout() {
    session = null;
    currentIndex = 0;
    errorMessage = null;
    isDemoMode = false;
    notifyListeners();
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.controller});

  final GonitorAppController controller;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _serverController = TextEditingController(text: 'http://127.0.0.1:8899');
  final _accountController = TextEditingController(text: 'admin');
  final _passwordController = TextEditingController(text: '123456');

  @override
  void dispose() {
    _serverController.dispose();
    _accountController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    try {
      await widget.controller.login(
        baseUrl: _serverController.text,
        account: _accountController.text,
        password: _passwordController.text,
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.controller.errorMessage ?? '登录失败')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= 920;
            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1120),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Flex(
                    direction: isWide ? Axis.horizontal : Axis.vertical,
                    children: [
                      Expanded(
                        flex: 11,
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(28),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: colorScheme.primaryContainer,
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    'Mobile First / Flutter / Adaptive',
                                    style: TextStyle(
                                      color: colorScheme.onPrimaryContainer,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 20),
                                Text(
                                  'Gonitor 移动工作台',
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineMedium
                                      ?.copyWith(fontWeight: FontWeight.w800),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  '把控制台、任务、节点、日志与系统设置压缩进一套手机友好的交互里，让用户在移动端也能快速查看状态、处理任务与跟进异常。',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyLarge
                                      ?.copyWith(color: Colors.black54, height: 1.55),
                                ),
                                const SizedBox(height: 24),
                                Wrap(
                                  spacing: 12,
                                  runSpacing: 12,
                                  children: const [
                                    HighlightChip(label: '任务启停 / 立即执行'),
                                    HighlightChip(label: '节点在线状态 / 密钥操作'),
                                    HighlightChip(label: '运维概览 / 审计日志'),
                                    HighlightChip(label: '自适应窄屏 / 宽屏'),
                                  ],
                                ),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.all(18),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF101828),
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '本次交付重点',
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleMedium
                                            ?.copyWith(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w700,
                                            ),
                                      ),
                                      const SizedBox(height: 12),
                                      const InfoBullet(
                                        title: 'Monorepo 扩展点',
                                        message: '新增 apps/mobile，使仓库具备多端共存的单仓演进基础。',
                                      ),
                                      const InfoBullet(
                                        title: '现代化信息密度',
                                        message: '大量使用摘要卡片、状态标签和双栏详情布局优化手机浏览体验。',
                                      ),
                                      const InfoBullet(
                                        title: '真实接口 + Demo 双模式',
                                        message: '现场没有 Flutter 环境时依然可以通过 Demo 流程快速演示页面能力。',
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 24, height: 24),
                      Expanded(
                        flex: 9,
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(28),
                            child: Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '连接你的 Gonitor',
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineSmall
                                        ?.copyWith(fontWeight: FontWeight.w800),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '支持直接接入现有 Go API，也支持先用 Demo 模式预览移动端工作流。',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(color: Colors.black54),
                                  ),
                                  const SizedBox(height: 24),
                                  TextFormField(
                                    controller: _serverController,
                                    decoration: const InputDecoration(
                                      labelText: '服务地址',
                                      hintText: 'http://127.0.0.1:8899',
                                    ),
                                    validator: (value) => (value == null || value.trim().isEmpty)
                                        ? '请输入服务地址'
                                        : null,
                                  ),
                                  const SizedBox(height: 16),
                                  TextFormField(
                                    controller: _accountController,
                                    decoration: const InputDecoration(labelText: '账号'),
                                    validator: (value) => (value == null || value.trim().isEmpty)
                                        ? '请输入账号'
                                        : null,
                                  ),
                                  const SizedBox(height: 16),
                                  TextFormField(
                                    controller: _passwordController,
                                    obscureText: true,
                                    decoration: const InputDecoration(labelText: '密码'),
                                    validator: (value) => (value == null || value.trim().isEmpty)
                                        ? '请输入密码'
                                        : null,
                                  ),
                                  const SizedBox(height: 20),
                                  if (widget.controller.errorMessage != null)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 16),
                                      child: Text(
                                        widget.controller.errorMessage!,
                                        style: TextStyle(color: colorScheme.error),
                                      ),
                                    ),
                                  FilledButton.icon(
                                    onPressed: widget.controller.isBusy ? null : _submit,
                                    icon: widget.controller.isBusy
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(strokeWidth: 2),
                                          )
                                        : const Icon(Icons.login_rounded),
                                    label: const Text('登录并同步数据'),
                                    style: FilledButton.styleFrom(
                                      minimumSize: const Size.fromHeight(54),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  OutlinedButton.icon(
                                    onPressed: widget.controller.isBusy
                                        ? null
                                        : () => widget.controller.useDemoMode(),
                                    icon: const Icon(Icons.smartphone_rounded),
                                    label: const Text('直接体验 Demo'),
                                    style: OutlinedButton.styleFrom(
                                      minimumSize: const Size.fromHeight(54),
                                    ),
                                  ),
                                  const SizedBox(height: 20),
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF8FAFC),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: const Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('移动端建议场景', style: TextStyle(fontWeight: FontWeight.w700)),
                                        SizedBox(height: 10),
                                        Text('• 通勤路上查看整体健康度与异常节点'),
                                        Text('• 非电脑场景快速启停任务、查看日志'),
                                        Text('• On-call 值班时第一时间确认任务是否失败'),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class HomeShell extends StatelessWidget {
  const HomeShell({super.key, required this.controller});

  final GonitorAppController controller;

  @override
  Widget build(BuildContext context) {
    final pages = [
      OverviewPage(controller: controller),
      TasksPage(controller: controller),
      NodesPage(controller: controller),
      UsersPage(controller: controller),
      LogsPage(controller: controller),
      SettingsPage(controller: controller),
    ];
    const destinations = [
      NavigationDestination(icon: Icon(Icons.space_dashboard_outlined), label: '概览'),
      NavigationDestination(icon: Icon(Icons.task_alt_outlined), label: '任务'),
      NavigationDestination(icon: Icon(Icons.cloud_outlined), label: '节点'),
      NavigationDestination(icon: Icon(Icons.people_alt_outlined), label: '用户'),
      NavigationDestination(icon: Icon(Icons.history_toggle_off), label: '日志'),
      NavigationDestination(icon: Icon(Icons.settings_outlined), label: '设置'),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final isRail = constraints.maxWidth >= 860;
        final selectedPage = pages[controller.currentIndex];
        final shellBody = RefreshIndicator(
          onRefresh: controller.refreshAll,
          child: selectedPage,
        );
        if (!isRail) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Gonitor Mobile'),
              actions: [
                if (controller.isDemoMode)
                  const Padding(
                    padding: EdgeInsets.only(right: 8),
                    child: Center(child: DemoBadge()),
                  ),
                IconButton(
                  onPressed: controller.isRefreshing ? null : controller.refreshAll,
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
            body: shellBody,
            bottomNavigationBar: NavigationBar(
              selectedIndex: controller.currentIndex,
              onDestinationSelected: controller.selectTab,
              destinations: destinations,
            ),
          );
        }

        return Scaffold(
          body: SafeArea(
            child: Row(
              children: [
                NavigationRail(
                  selectedIndex: controller.currentIndex,
                  onDestinationSelected: controller.selectTab,
                  labelType: NavigationRailLabelType.all,
                  leading: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 16, 12, 24),
                    child: Column(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primaryContainer,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(
                            Icons.monitor_heart_outlined,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (controller.isDemoMode) const DemoBadge(),
                      ],
                    ),
                  ),
                  trailing: Expanded(
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: IconButton.filledTonal(
                          onPressed: controller.logout,
                          icon: const Icon(Icons.logout_rounded),
                        ),
                      ),
                    ),
                  ),
                  destinations: const [
                    NavigationRailDestination(
                      icon: Icon(Icons.space_dashboard_outlined),
                      label: Text('概览'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.task_alt_outlined),
                      label: Text('任务'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.cloud_outlined),
                      label: Text('节点'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.people_alt_outlined),
                      label: Text('用户'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.history_toggle_off),
                      label: Text('日志'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.settings_outlined),
                      label: Text('设置'),
                    ),
                  ],
                ),
                const VerticalDivider(width: 1),
                Expanded(
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '欢迎，${controller.session?.account ?? 'user'}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineSmall
                                        ?.copyWith(fontWeight: FontWeight.w800),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    controller.isDemoMode
                                        ? '当前为 Demo 数据模式，可直接预览全部界面'
                                        : '当前已连接 ${controller.session?.baseUrl}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(color: Colors.black54),
                                  ),
                                ],
                              ),
                            ),
                            FilledButton.tonalIcon(
                              onPressed: controller.isRefreshing ? null : controller.refreshAll,
                              icon: const Icon(Icons.refresh_rounded),
                              label: const Text('刷新'),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 1),
                      Expanded(child: shellBody),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class OverviewPage extends StatelessWidget {
  const OverviewPage({super.key, required this.controller});

  final GonitorAppController controller;

  @override
  Widget build(BuildContext context) {
    final data = controller.dashboard;
    final counts = data.settings.counts;
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            SummaryCard(
              title: '总任务',
              value: counts.tasks.toString(),
              subtitle: '启用 ${counts.enabledTasks} / 依赖 ${counts.dependencyTasks}',
              icon: Icons.task_alt_rounded,
              tint: const Color(0xFFE9F0FF),
            ),
            SummaryCard(
              title: '节点',
              value: counts.nodes.toString(),
              subtitle: '在线 ${counts.onlineNodes} / 内存调度组 ${counts.runningTaskGroups}',
              icon: Icons.cloud_done_outlined,
              tint: const Color(0xFFEAFBF2),
            ),
            SummaryCard(
              title: '用户',
              value: counts.users.toString(),
              subtitle: '移动值守适合只读 / 管理双角色',
              icon: Icons.people_outline_rounded,
              tint: const Color(0xFFFFF1E8),
            ),
            SummaryCard(
              title: '版本',
              value: data.settings.version,
              subtitle: 'Commit ${data.settings.gitCommit}',
              icon: Icons.verified_outlined,
              tint: const Color(0xFFF4EEFF),
            ),
          ],
        ),
        const SizedBox(height: 18),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SectionHeader(
                  title: '系统健康概览',
                  subtitle: '把手机端最常用的指标压缩成可快速扫描的卡片。',
                ),
                const SizedBox(height: 16),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final twoColumns = constraints.maxWidth >= 680;
                    final children = [
                      MetricCard(
                        title: 'CPU 占用',
                        value: '${data.cpu.totalPercent.toStringAsFixed(1)}%',
                        detail: '物理 ${data.cpu.physicalCoresCount} 核 / 逻辑 ${data.cpu.logicalCoresCount} 核',
                        progress: (data.cpu.totalPercent / 100).clamp(0, 1),
                        color: const Color(0xFF2E6BFF),
                      ),
                      MetricCard(
                        title: '内存占用',
                        value: '${data.memory.usedPercent.toStringAsFixed(1)}%',
                        detail: '${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}',
                        progress: (data.memory.usedPercent / 100).clamp(0, 1),
                        color: const Color(0xFF16A34A),
                      ),
                      MetricCard(
                        title: '磁盘空间',
                        value: formatBytes(data.disk.free),
                        detail: '文件系统 ${data.disk.fileSystem} · 已用 ${formatBytes(data.disk.used)}',
                        progress: data.disk.total == 0 ? 0 : (data.disk.used / data.disk.total).clamp(0, 1),
                        color: const Color(0xFFF97316),
                      ),
                      MetricCard(
                        title: '系统负载',
                        value: data.overview.avg1,
                        detail: '${data.overview.platform} / ${data.overview.kernelArch}',
                        progress: ((double.tryParse(data.overview.avg1) ?? 0) / 4).clamp(0, 1),
                        color: const Color(0xFF7C3AED),
                      ),
                    ];
                    if (!twoColumns) {
                      return Column(
                        children: [
                          for (var i = 0; i < children.length; i++) ...[
                            children[i],
                            if (i != children.length - 1) const SizedBox(height: 12),
                          ],
                        ],
                      );
                    }
                    return Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: children
                          .map((child) => SizedBox(width: (constraints.maxWidth - 12) / 2, child: child))
                          .toList(),
                    );
                  },
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),
                Text('网络接口', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                ...data.network.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                        ),
                        Text('↑ ${formatBytes(item.bytesSent)}'),
                        const SizedBox(width: 12),
                        Text('↓ ${formatBytes(item.bytesRecv)}'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 18),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SectionHeader(
                  title: '功能能力映射',
                  subtitle: '移动端尽量覆盖现有仓库的重要功能，让用户在手机上也能完成高频操作。',
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: data.settings.features.entries
                      .map(
                        (entry) => Chip(
                          avatar: Icon(
                            entry.value ? Icons.check_circle_outline : Icons.highlight_off,
                            size: 18,
                            color: entry.value ? Colors.green : Colors.red,
                          ),
                          label: Text(entry.key),
                        ),
                      )
                      .toList(),
                ),
                const SizedBox(height: 18),
                Text(
                  '运行环境：${data.overview.os} · ${data.overview.platform} · Boot ${data.overview.bootTime}',
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class TasksPage extends StatefulWidget {
  const TasksPage({super.key, required this.controller});

  final GonitorAppController controller;

  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage> {
  String query = '';

  @override
  Widget build(BuildContext context) {
    final tasks = widget.controller.tasks
        .where((task) => task.searchIndex.contains(query.toLowerCase()))
        .toList();
    return LayoutBuilder(
      builder: (context, constraints) {
        final isTwoPane = constraints.maxWidth >= 980;
        final list = ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            decoration: const InputDecoration(
                              prefixIcon: Icon(Icons.search_rounded),
                              hintText: '搜索任务名称、命令、标签...',
                            ),
                            onChanged: (value) => setState(() => query = value.trim()),
                          ),
                        ),
                        const SizedBox(width: 12),
                        FilledButton.tonalIcon(
                          onPressed: widget.controller.refreshAll,
                          icon: const Icon(Icons.sync_rounded),
                          label: const Text('同步'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        StatusPill(label: '总数 ${widget.controller.tasks.length}', color: const Color(0xFFE9F0FF)),
                        StatusPill(
                          label: '启用 ${widget.controller.tasks.where((task) => !task.isDisabled).length}',
                          color: const Color(0xFFEAFBF2),
                        ),
                        StatusPill(
                          label: '超时保护 ${widget.controller.tasks.where((task) => task.timeout > 0).length}',
                          color: const Color(0xFFFFF1E8),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            ...tasks.map(
              (task) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: TaskCard(
                  task: task,
                  selected: widget.controller.selectedTaskDetail?.task.id == task.id,
                  onTap: () async {
                    await widget.controller.selectTask(task);
                    if (!isTwoPane && context.mounted) {
                      _showTaskDetailSheet(context, widget.controller);
                    }
                  },
                  onAction: (action) => _runTaskAction(context, task, action),
                ),
              ),
            ),
          ],
        );

        if (!isTwoPane) {
          return list;
        }
        return Row(
          children: [
            SizedBox(width: 420, child: list),
            const VerticalDivider(width: 1),
            Expanded(
              child: TaskDetailPanel(
                controller: widget.controller,
                onAction: _runTaskAction,
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _runTaskAction(BuildContext context, TaskSummary task, TaskAction action) async {
    try {
      final message = await widget.controller.triggerTaskAction(task, action);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  void _showTaskDetailSheet(BuildContext context, GonitorAppController controller) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (context) => FractionallySizedBox(
        heightFactor: 0.92,
        child: TaskDetailPanel(controller: controller, onAction: _runTaskAction),
      ),
    );
  }
}

class NodesPage extends StatelessWidget {
  const NodesPage({super.key, required this.controller});

  final GonitorAppController controller;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SectionHeader(
          title: '节点管理',
          subtitle: '移动端保留最常用的运行态信息，让值班人员能第一时间发现离线节点。',
        ),
        const SizedBox(height: 16),
        ...controller.nodes.map(
          (node) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(node.name, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                              const SizedBox(height: 6),
                              Text(node.region.isEmpty ? '未设置区域' : node.region),
                            ],
                          ),
                        ),
                        StatusIndicator(label: node.isOnline ? '在线' : '离线', online: node.isOnline),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        InfoTag(label: node.isMaster ? '主节点' : '边缘节点'),
                        InfoTag(label: node.os.isEmpty ? '系统未知' : node.os),
                        InfoTag(label: node.arch.isEmpty ? '架构未知' : node.arch),
                        InfoTag(label: 'CPU ${node.cpuCores}'),
                        InfoTag(label: '内存 ${formatBytes(node.memoryTotal)}'),
                      ],
                    ),
                    const SizedBox(height: 14),
                    DetailRow(label: '地址', value: node.address.ifEmpty('-')),
                    DetailRow(label: 'IP', value: node.ip.ifEmpty('-')),
                    DetailRow(label: 'Agent', value: node.agentVersion.ifEmpty('-')),
                    DetailRow(label: '最近心跳', value: node.lastPingAt.ifEmpty('-')),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        OutlinedButton.icon(
                          onPressed: node.secretKey.isEmpty
                              ? null
                              : () async {
                                  await Clipboard.setData(ClipboardData(text: node.secretKey));
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('节点密钥已复制')),
                                    );
                                  }
                                },
                          icon: const Icon(Icons.copy_all_outlined),
                          label: const Text('复制密钥'),
                        ),
                        const SizedBox(width: 10),
                        FilledButton.tonalIcon(
                          onPressed: node.isMaster
                              ? null
                              : () async {
                                  final message = await controller.regenerateNodeKey(node);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context)
                                        .showSnackBar(SnackBar(content: Text(message)));
                                  }
                                },
                          icon: const Icon(Icons.vpn_key_outlined),
                          label: const Text('重置密钥'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class UsersPage extends StatelessWidget {
  const UsersPage({super.key, required this.controller});

  final GonitorAppController controller;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SectionHeader(
          title: '用户与协作',
          subtitle: '移动端优先保证查看与联系能力，便于 on-call 或管理者快速识别责任人。',
        ),
        const SizedBox(height: 16),
        ...controller.users.map(
          (user) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Card(
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                leading: CircleAvatar(
                  radius: 28,
                  backgroundColor: const Color(0xFFE9F0FF),
                  child: Text(user.username.isEmpty ? '?' : user.username.substring(0, 1)),
                ),
                title: Text(user.username, style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('账号：${user.loginAccount}'),
                      Text('创建时间：${user.createTime.ifEmpty('-')}'),
                    ],
                  ),
                ),
                trailing: const Icon(Icons.chevron_right_rounded),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class LogsPage extends StatelessWidget {
  const LogsPage({super.key, required this.controller});

  final GonitorAppController controller;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SectionHeader(
          title: '操作审计',
          subtitle: '用时间线强化“谁在什么时候做了什么”的移动端可读性。',
        ),
        const SizedBox(height: 16),
        ...controller.operations.map(
          (record) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        color: Color(0xFFE9F0FF),
                        borderRadius: BorderRadius.all(Radius.circular(16)),
                      ),
                      child: const Icon(Icons.history_edu_outlined),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(record.opType, style: const TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 6),
                          Text('${record.username} · ${record.createTime.ifEmpty('-')}'),
                          const SizedBox(height: 8),
                          Text(record.remark.ifEmpty('无详细备注')),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key, required this.controller});

  final GonitorAppController controller;

  @override
  Widget build(BuildContext context) {
    final settings = controller.dashboard.settings;
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: '系统设置',
                  subtitle: '把移动端最关心的配置项折叠成信息块，方便临时查看与联调。',
                ),
                const SizedBox(height: 16),
                DetailRow(label: '服务地址', value: controller.session?.baseUrl ?? '-'),
                DetailRow(label: '版本', value: settings.version),
                DetailRow(label: '构建时间', value: settings.buildTime),
                DetailRow(label: 'Go 版本', value: settings.goVersion),
                DetailRow(label: '数据库', value: settings.database['driver'] ?? '-'),
                DetailRow(label: 'HTTP', value: '${settings.httpServer['host'] ?? '-'}:${settings.httpServer['port'] ?? '-'}'),
                DetailRow(label: '脚本目录', value: settings.script['folder'] ?? '-'),
                DetailRow(label: '日志目录', value: settings.script['log_folder'] ?? '-'),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: settings.features.entries
                      .map((entry) => Chip(label: Text('${entry.key}: ${entry.value ? 'on' : 'off'}')))
                      .toList(),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    FilledButton.tonalIcon(
                      onPressed: () async {
                        final message = await controller.testPush();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context)
                              .showSnackBar(SnackBar(content: Text(message)));
                        }
                      },
                      icon: const Icon(Icons.notifications_active_outlined),
                      label: const Text('测试推送'),
                    ),
                    OutlinedButton.icon(
                      onPressed: controller.logout,
                      icon: const Icon(Icons.logout_rounded),
                      label: const Text('退出登录'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class TaskDetailPanel extends StatelessWidget {
  const TaskDetailPanel({
    super.key,
    required this.controller,
    required this.onAction,
  });

  final GonitorAppController controller;
  final Future<void> Function(BuildContext context, TaskSummary task, TaskAction action) onAction;

  @override
  Widget build(BuildContext context) {
    final detail = controller.selectedTaskDetail;
    if (detail == null) {
      return const Center(child: Text('请选择一个任务查看详情'));
    }
    final task = detail.task;
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(task.name, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                          const SizedBox(height: 8),
                          Text(task.description.ifEmpty('暂无任务描述'), style: const TextStyle(color: Colors.black54)),
                        ],
                      ),
                    ),
                    StatusIndicator(label: task.isDisabled ? 'Disabled' : 'Enabled', online: !task.isDisabled),
                  ],
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    InfoTag(label: task.priorityLabel),
                    InfoTag(label: task.execType.ifEmpty('unknown')),
                    InfoTag(label: '策略 ${task.execStrategyLabel}'),
                    if (task.tags.isNotEmpty) ...task.tags.map((tag) => InfoTag(label: tag)),
                  ],
                ),
                const SizedBox(height: 16),
                DetailRow(label: '调度', value: task.schedule),
                DetailRow(label: '命令 / 请求', value: task.command),
                DetailRow(label: '节点', value: task.nodeName.ifEmpty('主节点')),
                DetailRow(label: '上次执行', value: task.lastRunTime.ifEmpty('-')),
                DetailRow(label: '下次执行', value: task.nextRunTime.ifEmpty('-')),
                DetailRow(label: '超时', value: task.timeout > 0 ? '${task.timeout}s' : '未设置'),
                DetailRow(label: '重试', value: '${task.retryTimes} 次 / 间隔 ${task.retryInterval}ms'),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    FilledButton.icon(
                      onPressed: () => onAction(context, task, task.isDisabled ? TaskAction.start : TaskAction.stop),
                      icon: Icon(task.isDisabled ? Icons.play_arrow_rounded : Icons.pause_circle_outline),
                      label: Text(task.isDisabled ? '启用任务' : '停用任务'),
                    ),
                    OutlinedButton.icon(
                      onPressed: () => onAction(context, task, TaskAction.runOnce),
                      icon: const Icon(Icons.play_circle_outline_rounded),
                      label: const Text('立即执行'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: '执行日志',
                  subtitle: '移动端优先展示运行中和最近结束的记录，方便快速定位异常。',
                ),
                const SizedBox(height: 16),
                Text('运行中', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                if (detail.runningLogs.isEmpty)
                  const Text('当前没有运行中的实例')
                else
                  ...detail.runningLogs.map((log) => LogTile(record: log)),
                const SizedBox(height: 18),
                Text('最近结束', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                if (detail.endedLogs.isEmpty)
                  const Text('暂无已结束日志')
                else
                  ...detail.endedLogs.map((log) => LogTile(record: log)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class LogTile extends StatelessWidget {
  const LogTile({super.key, required this.record});

  final TaskExecutionLog record;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(record.title, style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
              StatusIndicator(label: record.statusLabel, online: record.success),
            ],
          ),
          const SizedBox(height: 8),
          Text(record.execTime.ifEmpty('-')),
          if (record.duration.isNotEmpty) Text('耗时 ${record.duration}'),
          if (record.output.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              record.output,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12.5),
            ),
          ],
        ],
      ),
    );
  }
}

class TaskCard extends StatelessWidget {
  const TaskCard({
    super.key,
    required this.task,
    required this.selected,
    required this.onTap,
    required this.onAction,
  });

  final TaskSummary task;
  final bool selected;
  final VoidCallback onTap;
  final Future<void> Function(TaskAction action) onAction;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(
          color: selected ? Theme.of(context).colorScheme.primary : Colors.transparent,
          width: 1.5,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(task.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        const SizedBox(height: 6),
                        Text(
                          task.description.ifEmpty(task.command),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.black54, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  StatusIndicator(label: task.isDisabled ? '停用' : '启用', online: !task.isDisabled),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  InfoTag(label: task.priorityLabel),
                  InfoTag(label: task.execType),
                  InfoTag(label: task.nodeName.ifEmpty('主节点')),
                  ...task.tags.take(2).map((tag) => InfoTag(label: tag)),
                ],
              ),
              const SizedBox(height: 12),
              DetailRow(label: '调度', value: task.schedule),
              DetailRow(label: '最近执行', value: task.lastRunTime.ifEmpty('-')),
              const SizedBox(height: 12),
              Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: () => onAction(task.isDisabled ? TaskAction.start : TaskAction.stop),
                    icon: Icon(task.isDisabled ? Icons.play_arrow_rounded : Icons.pause_circle_outline),
                    label: Text(task.isDisabled ? '启用' : '停用'),
                  ),
                  const SizedBox(width: 10),
                  FilledButton.tonalIcon(
                    onPressed: () => onAction(TaskAction.runOnce),
                    icon: const Icon(Icons.play_circle_fill_rounded),
                    label: const Text('立即执行'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SummaryCard extends StatelessWidget {
  const SummaryCard({
    super.key,
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.tint,
  });

  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color tint;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 250,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: tint, borderRadius: BorderRadius.circular(16)),
                child: Icon(icon),
              ),
              const SizedBox(height: 18),
              Text(title, style: const TextStyle(color: Colors.black54)),
              const SizedBox(height: 6),
              Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(subtitle, style: const TextStyle(color: Colors.black54, height: 1.4)),
            ],
          ),
        ),
      ),
    );
  }
}

class MetricCard extends StatelessWidget {
  const MetricCard({
    super.key,
    required this.title,
    required this.value,
    required this.detail,
    required this.progress,
    required this.color,
  });

  final String title;
  final String value;
  final String detail;
  final double progress;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                minHeight: 10,
                value: progress,
                color: color,
                backgroundColor: color.withOpacity(0.14),
              ),
            ),
            const SizedBox(height: 10),
            Text(detail, style: const TextStyle(color: Colors.black54)),
          ],
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(subtitle, style: const TextStyle(color: Colors.black54, height: 1.45)),
      ],
    );
  }
}

class HighlightChip extends StatelessWidget {
  const HighlightChip({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
    );
  }
}

class InfoBullet extends StatelessWidget {
  const InfoBullet({super.key, required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 10,
            height: 10,
            margin: const EdgeInsets.only(top: 6),
            decoration: const BoxDecoration(
              color: Color(0xFF60A5FA),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(color: Colors.white70, height: 1.5),
                children: [
                  TextSpan(
                    text: '$title：',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                  ),
                  TextSpan(text: message),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DemoBadge extends StatelessWidget {
  const DemoBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1E8),
        borderRadius: BorderRadius.circular(999),
      ),
      child: const Text('Demo', style: TextStyle(fontWeight: FontWeight.w700)),
    );
  }
}

class InfoTag extends StatelessWidget {
  const InfoTag({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(label),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
    );
  }
}

class StatusIndicator extends StatelessWidget {
  const StatusIndicator({super.key, required this.label, required this.online});

  final String label;
  final bool online;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: online ? const Color(0xFFEAFBF2) : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: online ? const Color(0xFF166534) : const Color(0xFF4B5563),
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class DetailRow extends StatelessWidget {
  const DetailRow({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 88,
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

class GonitorApiClient {
  Future<String> login({
    required String baseUrl,
    required String account,
    required String password,
  }) async {
    final data = await _request(
      Uri.parse('$baseUrl/user/login'),
      method: 'POST',
      form: {
        'login_account': account,
        'password': password,
      },
    );
    if (data is String && data.isNotEmpty) {
      return data;
    }
    throw Exception('登录返回的 Token 无效');
  }

  Future<SystemOverview> getSystemOverview(AppSession session) async {
    final json = await _get(session, '/system/overview');
    return SystemOverview.fromJson(asMap(json));
  }

  Future<CpuSnapshot> getCpu(AppSession session) async {
    final json = await _get(session, '/system/cpu');
    return CpuSnapshot.fromJson(asMap(json));
  }

  Future<MemorySnapshot> getMemory(AppSession session) async {
    final json = await _get(session, '/system/memory');
    return MemorySnapshot.fromJson(asMap(json));
  }

  Future<DiskSnapshot> getDisk(AppSession session) async {
    final json = await _get(session, '/system/disk');
    return DiskSnapshot.fromJson(asMap(json));
  }

  Future<List<NetworkSnapshot>> getNet(AppSession session) async {
    final json = await _get(session, '/system/net');
    return asList(json).map((item) => NetworkSnapshot.fromJson(asMap(item))).toList();
  }

  Future<SystemSettingsSnapshot> getSystemSettings(AppSession session) async {
    final json = await _get(session, '/system/settings');
    return SystemSettingsSnapshot.fromJson(asMap(json));
  }

  Future<List<TaskSummary>> getTaskList(AppSession session) async {
    final json = await _get(session, '/task/list');
    return asList(json).map((item) => TaskSummary.fromJson(asMap(item))).toList();
  }

  Future<TaskDetailBundle> getTaskDetail(AppSession session, int taskId) async {
    final results = await Future.wait<dynamic>([
      _get(session, '/task/info/$taskId'),
      _get(session, '/task/log/list/running/$taskId'),
      _get(session, '/task/log/list/$taskId/1/10'),
    ]);
    final task = TaskSummary.fromJson(asMap(results[0]));
    final runningLogs = asList(results[1])
        .map((item) => TaskExecutionLog.fromJson(asMap(item), fallbackTitle: '运行中实例'))
        .toList();
    final endedLogs = asList(asMap(results[2])['list'])
        .map((item) => TaskExecutionLog.fromJson(asMap(item), fallbackTitle: '结束实例'))
        .toList();
    return TaskDetailBundle(task: task, runningLogs: runningLogs, endedLogs: endedLogs);
  }

  Future<String> triggerTaskAction(AppSession session, int taskId, TaskAction action) async {
    final path = switch (action) {
      TaskAction.start => '/task/start/$taskId',
      TaskAction.stop => '/task/stop/$taskId',
      TaskAction.runOnce => '/task/test/$taskId',
    };
    final data = await _get(session, path, includeMessageWhenEmpty: true);
    if (data is Map<String, dynamic> && data['output'] != null) {
      return data['output'].toString();
    }
    if (data is String) {
      return data;
    }
    return '操作成功';
  }

  Future<List<NodeSummary>> getNodeList(AppSession session) async {
    final json = await _get(session, '/node/list');
    return asList(json).map((item) => NodeSummary.fromJson(asMap(item))).toList();
  }

  Future<String> regenerateNodeKey(AppSession session, int nodeId) async {
    await _get(session, '/node/regenerate/$nodeId');
    return '节点密钥已重新生成';
  }

  Future<List<UserSummary>> getUserList(AppSession session) async {
    final json = await _get(session, '/user/list/1/20');
    return asList(asMap(json)['list']).map((item) => UserSummary.fromJson(asMap(item))).toList();
  }

  Future<List<OperationRecord>> getOperationList(AppSession session) async {
    final json = await _get(session, '/op/list/1/20');
    return asList(asMap(json)['list'])
        .map((item) => OperationRecord.fromJson(asMap(item)))
        .toList();
  }

  Future<String> testPush(AppSession session) async {
    final data = await _get(session, '/push/test', includeMessageWhenEmpty: true);
    if (data is String && data.isNotEmpty) {
      return data;
    }
    return '推送测试已触发';
  }

  Future<dynamic> _get(AppSession session, String path, {bool includeMessageWhenEmpty = false}) async {
    return _request(
      Uri.parse('${session.baseUrl}$path'),
      token: session.token,
      includeMessageWhenEmpty: includeMessageWhenEmpty,
    );
  }

  Future<dynamic> _request(
    Uri uri, {
    String method = 'GET',
    String? token,
    Map<String, String>? form,
    bool includeMessageWhenEmpty = false,
  }) async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 8);
    try {
      final request = await client.openUrl(method, uri);
      request.headers.set(HttpHeaders.acceptHeader, 'application/json');
      if (token != null && token.isNotEmpty) {
        request.headers.set('Token', token);
      }
      if (form != null) {
        request.headers.contentType = ContentType('application', 'x-www-form-urlencoded', charset: 'utf-8');
        request.write(Uri(queryParameters: form).query);
      }
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception('请求失败(${response.statusCode})');
      }
      final decoded = body.isEmpty ? <String, dynamic>{} : jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        final code = asInt(decoded['code']);
        final message = decoded['message']?.toString() ?? '';
        if (code != 0) {
          throw Exception(message.isEmpty ? '接口返回错误 code=$code' : message);
        }
        final data = decoded['data'];
        if (data == null && includeMessageWhenEmpty && message.isNotEmpty) {
          return message;
        }
        return data;
      }
      return decoded;
    } on SocketException {
      throw Exception('无法连接到 Gonitor 服务，请检查地址与网络');
    } on TimeoutException {
      throw Exception('连接 Gonitor 服务超时');
    } finally {
      client.close(force: true);
    }
  }
}

class AppSession {
  const AppSession({required this.baseUrl, required this.token, required this.account});

  final String baseUrl;
  final String token;
  final String account;
}

class DashboardBundle {
  const DashboardBundle({
    required this.overview,
    required this.cpu,
    required this.memory,
    required this.disk,
    required this.network,
    required this.settings,
  });

  final SystemOverview overview;
  final CpuSnapshot cpu;
  final MemorySnapshot memory;
  final DiskSnapshot disk;
  final List<NetworkSnapshot> network;
  final SystemSettingsSnapshot settings;
}

class TaskDetailBundle {
  const TaskDetailBundle({required this.task, required this.runningLogs, required this.endedLogs});

  final TaskSummary task;
  final List<TaskExecutionLog> runningLogs;
  final List<TaskExecutionLog> endedLogs;

  TaskDetailBundle copyWith({TaskSummary? task, List<TaskExecutionLog>? runningLogs, List<TaskExecutionLog>? endedLogs}) {
    return TaskDetailBundle(
      task: task ?? this.task,
      runningLogs: runningLogs ?? this.runningLogs,
      endedLogs: endedLogs ?? this.endedLogs,
    );
  }
}

enum TaskAction { start, stop, runOnce }

class TaskSummary {
  const TaskSummary({
    required this.id,
    required this.name,
    required this.description,
    required this.command,
    required this.schedule,
    required this.execType,
    required this.isDisabled,
    required this.priority,
    required this.tags,
    required this.execStrategy,
    required this.retryTimes,
    required this.retryInterval,
    required this.timeout,
    required this.nodeName,
    required this.lastRunTime,
    required this.nextRunTime,
  });

  final int id;
  final String name;
  final String description;
  final String command;
  final String schedule;
  final String execType;
  final bool isDisabled;
  final int priority;
  final List<String> tags;
  final int execStrategy;
  final int retryTimes;
  final int retryInterval;
  final int timeout;
  final String nodeName;
  final String lastRunTime;
  final String nextRunTime;

  factory TaskSummary.fromJson(Map<String, dynamic> json) {
    return TaskSummary(
      id: asInt(json['id']),
      name: json['name']?.toString() ?? 'Unnamed task',
      description: json['description']?.toString() ?? '',
      command: json['command']?.toString() ?? '',
      schedule: json['schedule']?.toString() ?? '',
      execType: json['exec_type']?.toString() ?? '',
      isDisabled: asBool(json['is_disable']),
      priority: asInt(json['priority']),
      tags: (json['tags']?.toString() ?? '')
          .split(',')
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .toList(),
      execStrategy: asInt(json['exec_strategy']),
      retryTimes: asInt(json['retry_times']),
      retryInterval: asInt(json['retry_interval']),
      timeout: asInt(json['timeout']),
      nodeName: json['node_name']?.toString() ?? '',
      lastRunTime: json['last_run_time']?.toString() ?? '',
      nextRunTime: json['next_run_time']?.toString() ?? '',
    );
  }

  String get priorityLabel => switch (priority) {
        3 => 'Critical',
        2 => 'High',
        1 => 'Medium',
        _ => 'Low',
      };

  String get execStrategyLabel => switch (execStrategy) {
        2 => '延迟',
        1 => '跳过',
        _ => '并行',
      };

  String get searchIndex => [name, description, command, tags.join(' ')].join(' ').toLowerCase();

  TaskSummary copyWith({bool? isDisabled}) {
    return TaskSummary(
      id: id,
      name: name,
      description: description,
      command: command,
      schedule: schedule,
      execType: execType,
      isDisabled: isDisabled ?? this.isDisabled,
      priority: priority,
      tags: tags,
      execStrategy: execStrategy,
      retryTimes: retryTimes,
      retryInterval: retryInterval,
      timeout: timeout,
      nodeName: nodeName,
      lastRunTime: lastRunTime,
      nextRunTime: nextRunTime,
    );
  }
}

class NodeSummary {
  const NodeSummary({
    required this.id,
    required this.name,
    required this.region,
    required this.address,
    required this.secretKey,
    required this.status,
    required this.isMaster,
    required this.ip,
    required this.os,
    required this.arch,
    required this.cpuCores,
    required this.memoryTotal,
    required this.agentVersion,
    required this.lastPingAt,
  });

  final int id;
  final String name;
  final String region;
  final String address;
  final String secretKey;
  final int status;
  final bool isMaster;
  final String ip;
  final String os;
  final String arch;
  final int cpuCores;
  final int memoryTotal;
  final String agentVersion;
  final String lastPingAt;

  bool get isOnline => status == 1;

  factory NodeSummary.fromJson(Map<String, dynamic> json) {
    return NodeSummary(
      id: asInt(json['id']),
      name: json['name']?.toString() ?? 'Unnamed node',
      region: json['region']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      secretKey: json['secret_key']?.toString() ?? '',
      status: asInt(json['status']),
      isMaster: asBool(json['is_master']),
      ip: json['ip']?.toString() ?? '',
      os: json['os']?.toString() ?? '',
      arch: json['arch']?.toString() ?? '',
      cpuCores: asInt(json['cpu_cores']),
      memoryTotal: asInt(json['memory_total']),
      agentVersion: json['agent_version']?.toString() ?? '',
      lastPingAt: json['last_ping_at']?.toString() ?? '',
    );
  }
}

class UserSummary {
  const UserSummary({
    required this.id,
    required this.username,
    required this.loginAccount,
    required this.createTime,
  });

  final int id;
  final String username;
  final String loginAccount;
  final String createTime;

  factory UserSummary.fromJson(Map<String, dynamic> json) {
    return UserSummary(
      id: asInt(json['id']),
      username: json['username']?.toString() ?? '',
      loginAccount: json['login_account']?.toString() ?? '',
      createTime: json['create_time']?.toString() ?? '',
    );
  }
}

class OperationRecord {
  const OperationRecord({
    required this.id,
    required this.username,
    required this.opType,
    required this.remark,
    required this.createTime,
  });

  final int id;
  final String username;
  final String opType;
  final String remark;
  final String createTime;

  factory OperationRecord.fromJson(Map<String, dynamic> json) {
    return OperationRecord(
      id: asInt(json['id']),
      username: json['username']?.toString() ?? '',
      opType: json['op_type']?.toString() ?? '',
      remark: json['remark']?.toString() ?? '',
      createTime: json['create_time']?.toString() ?? '',
    );
  }
}

class TaskExecutionLog {
  const TaskExecutionLog({
    required this.title,
    required this.success,
    required this.statusLabel,
    required this.execTime,
    required this.duration,
    required this.output,
  });

  final String title;
  final bool success;
  final String statusLabel;
  final String execTime;
  final String duration;
  final String output;

  factory TaskExecutionLog.fromJson(Map<String, dynamic> json, {required String fallbackTitle}) {
    final status = asInt(json['status']);
    return TaskExecutionLog(
      title: json['title']?.toString() ?? json['task_name']?.toString() ?? fallbackTitle,
      success: status == 1 || json['is_success'] == true,
      statusLabel: status == 1 ? '成功' : (status == 2 ? '运行中' : '失败'),
      execTime: json['exec_time']?.toString() ?? '',
      duration: json['duration']?.toString() ?? '',
      output: json['exec_output']?.toString() ?? '',
    );
  }
}

class SystemOverview {
  const SystemOverview({
    required this.bootTime,
    required this.os,
    required this.platform,
    required this.kernelArch,
    required this.avg1,
  });

  final String bootTime;
  final String os;
  final String platform;
  final String kernelArch;
  final String avg1;

  factory SystemOverview.fromJson(Map<String, dynamic> json) {
    final avg = asMap(json['avg_stat']);
    return SystemOverview(
      bootTime: json['boot_time']?.toString() ?? '',
      os: json['os']?.toString() ?? '',
      platform: json['platform']?.toString() ?? '',
      kernelArch: json['kernel_arch']?.toString() ?? '',
      avg1: avg['load1']?.toString() ?? avg['Load1']?.toString() ?? '0',
    );
  }
}

class CpuSnapshot {
  const CpuSnapshot({
    required this.physicalCoresCount,
    required this.logicalCoresCount,
    required this.totalPercent,
  });

  final int physicalCoresCount;
  final int logicalCoresCount;
  final double totalPercent;

  factory CpuSnapshot.fromJson(Map<String, dynamic> json) {
    return CpuSnapshot(
      physicalCoresCount: asInt(json['physical_cores_count']),
      logicalCoresCount: asInt(json['logical_cores_count']),
      totalPercent: asDouble(json['total_percent']),
    );
  }
}

class MemorySnapshot {
  const MemorySnapshot({required this.total, required this.used, required this.usedPercent});

  final int total;
  final int used;
  final double usedPercent;

  factory MemorySnapshot.fromJson(Map<String, dynamic> json) {
    return MemorySnapshot(
      total: asInt(json['total']),
      used: asInt(json['used']),
      usedPercent: asDouble(json['used_percent']),
    );
  }
}

class DiskSnapshot {
  const DiskSnapshot({required this.total, required this.used, required this.free, required this.fileSystem});

  final int total;
  final int used;
  final int free;
  final String fileSystem;

  factory DiskSnapshot.fromJson(Map<String, dynamic> json) {
    return DiskSnapshot(
      total: asInt(json['total']),
      used: asInt(json['used']),
      free: asInt(json['free']),
      fileSystem: json['file_system']?.toString() ?? '',
    );
  }
}

class NetworkSnapshot {
  const NetworkSnapshot({required this.name, required this.bytesSent, required this.bytesRecv});

  final String name;
  final int bytesSent;
  final int bytesRecv;

  factory NetworkSnapshot.fromJson(Map<String, dynamic> json) {
    return NetworkSnapshot(
      name: json['name']?.toString() ?? 'unknown',
      bytesSent: asInt(json['bytesSent'] ?? json['bytes_sent']),
      bytesRecv: asInt(json['bytesRecv'] ?? json['bytes_recv']),
    );
  }
}

class SystemSettingsSnapshot {
  const SystemSettingsSnapshot({
    required this.version,
    required this.buildTime,
    required this.gitCommit,
    required this.goVersion,
    required this.database,
    required this.httpServer,
    required this.script,
    required this.features,
    required this.counts,
  });

  final String version;
  final String buildTime;
  final String gitCommit;
  final String goVersion;
  final Map<String, String> database;
  final Map<String, String> httpServer;
  final Map<String, String> script;
  final Map<String, bool> features;
  final SystemCounts counts;

  factory SystemSettingsSnapshot.fromJson(Map<String, dynamic> json) {
    return SystemSettingsSnapshot(
      version: json['version']?.toString() ?? 'dev',
      buildTime: json['build_time']?.toString() ?? '-',
      gitCommit: json['git_commit']?.toString() ?? '-',
      goVersion: json['go_version']?.toString() ?? '-',
      database: asStringMap(json['database']),
      httpServer: asStringMap(json['http_server']),
      script: asStringMap(json['script']),
      features: asBoolMap(json['features']),
      counts: SystemCounts.fromJson(asMap(json['counts'])),
    );
  }
}

class SystemCounts {
  const SystemCounts({
    required this.tasks,
    required this.enabledTasks,
    required this.dependencyTasks,
    required this.timeoutTasks,
    required this.nodes,
    required this.onlineNodes,
    required this.users,
    required this.runningTaskGroups,
  });

  final int tasks;
  final int enabledTasks;
  final int dependencyTasks;
  final int timeoutTasks;
  final int nodes;
  final int onlineNodes;
  final int users;
  final int runningTaskGroups;

  factory SystemCounts.fromJson(Map<String, dynamic> json) {
    return SystemCounts(
      tasks: asInt(json['tasks']),
      enabledTasks: asInt(json['enabled_tasks']),
      dependencyTasks: asInt(json['dependency_tasks']),
      timeoutTasks: asInt(json['timeout_tasks']),
      nodes: asInt(json['nodes']),
      onlineNodes: asInt(json['online_nodes']),
      users: asInt(json['users']),
      runningTaskGroups: asInt(json['running_task_groups']),
    );
  }
}

class DemoSeed {
  static const dashboard = DashboardBundle(
    overview: SystemOverview(
      bootTime: '2026-04-10 07:30:00',
      os: 'linux',
      platform: 'ubuntu',
      kernelArch: 'amd64',
      avg1: '0.62',
    ),
    cpu: CpuSnapshot(physicalCoresCount: 8, logicalCoresCount: 16, totalPercent: 33.5),
    memory: MemorySnapshot(total: 34359738368, used: 14817637171, usedPercent: 43.1),
    disk: DiskSnapshot(total: 274877906944, used: 122406567936, free: 152471339008, fileSystem: 'ext4'),
    network: [
      NetworkSnapshot(name: 'eth0', bytesSent: 123456789, bytesRecv: 456789123),
      NetworkSnapshot(name: 'wg0', bytesSent: 99887766, bytesRecv: 66778899),
    ],
    settings: SystemSettingsSnapshot(
      version: 'v0.1.0-mobile',
      buildTime: '2026-04-12 07:33:38',
      gitCommit: 'mobile-demo',
      goVersion: 'go1.23',
      database: {'driver': 'sqlite3'},
      httpServer: {'host': '0.0.0.0', 'port': '8899'},
      script: {'folder': 'script', 'log_folder': 'tmp/log'},
      features: {
        'task_timeout': true,
        'task_dependency': true,
        'system_settings': true,
        'prometheus_metrics': true,
        'task_export': true,
        'task_import': true,
        'health_check': true,
      },
      counts: SystemCounts(
        tasks: 42,
        enabledTasks: 35,
        dependencyTasks: 9,
        timeoutTasks: 16,
        nodes: 5,
        onlineNodes: 4,
        users: 6,
        runningTaskGroups: 12,
      ),
    ),
  );

  static const tasks = [
    TaskSummary(
      id: 1,
      name: 'daily-report-sync',
      description: '每天汇总主节点任务数据并下发周报。',
      command: 'bash script/report.sh',
      schedule: '0 0 8 * * *',
      execType: 'cmd',
      isDisabled: false,
      priority: 2,
      tags: ['report', 'daily'],
      execStrategy: 0,
      retryTimes: 2,
      retryInterval: 3000,
      timeout: 180,
      nodeName: 'master',
      lastRunTime: '2026-04-12 08:00:01',
      nextRunTime: '2026-04-13 08:00:00',
    ),
    TaskSummary(
      id: 2,
      name: 'health-check-http',
      description: '每 5 分钟巡检业务服务健康状态。',
      command: 'GET https://service.example.com/healthz',
      schedule: '0 */5 * * * *',
      execType: 'http',
      isDisabled: false,
      priority: 3,
      tags: ['health', 'api'],
      execStrategy: 1,
      retryTimes: 3,
      retryInterval: 5000,
      timeout: 30,
      nodeName: '上海边缘',
      lastRunTime: '2026-04-12 07:30:05',
      nextRunTime: '2026-04-12 07:35:00',
    ),
    TaskSummary(
      id: 3,
      name: 'archive-old-logs',
      description: '归档历史执行日志，减轻主库压力。',
      command: 'python script/archive_logs.py',
      schedule: '0 30 2 * * *',
      execType: 'file',
      isDisabled: true,
      priority: 1,
      tags: ['ops'],
      execStrategy: 2,
      retryTimes: 1,
      retryInterval: 10000,
      timeout: 600,
      nodeName: '东京边缘',
      lastRunTime: '2026-04-11 02:30:04',
      nextRunTime: '2026-04-13 02:30:00',
    ),
  ];

  static const nodes = [
    NodeSummary(
      id: 1,
      name: 'master',
      region: 'Hangzhou',
      address: 'http://127.0.0.1:8899',
      secretKey: '',
      status: 1,
      isMaster: true,
      ip: '10.0.0.1',
      os: 'linux',
      arch: 'amd64',
      cpuCores: 16,
      memoryTotal: 34359738368,
      agentVersion: 'master',
      lastPingAt: '2026-04-12 07:33:00',
    ),
    NodeSummary(
      id: 2,
      name: '上海边缘',
      region: 'Shanghai',
      address: 'http://10.10.1.10:8899',
      secretKey: 'abcd1234efgh5678ijkl9012mnop3456',
      status: 1,
      isMaster: false,
      ip: '10.10.1.10',
      os: 'linux',
      arch: 'arm64',
      cpuCores: 8,
      memoryTotal: 17179869184,
      agentVersion: 'v0.9.2',
      lastPingAt: '2026-04-12 07:32:55',
    ),
    NodeSummary(
      id: 3,
      name: '东京边缘',
      region: 'Tokyo',
      address: 'http://10.10.3.18:8899',
      secretKey: 'qrst1234uvwx5678yzab9012cdef3456',
      status: 0,
      isMaster: false,
      ip: '10.10.3.18',
      os: 'linux',
      arch: 'amd64',
      cpuCores: 4,
      memoryTotal: 8589934592,
      agentVersion: 'v0.9.1',
      lastPingAt: '2026-04-12 06:58:10',
    ),
  ];

  static const users = [
    UserSummary(id: 1, username: 'Admin', loginAccount: 'admin', createTime: '2026-03-01 10:00:00'),
    UserSummary(id: 2, username: 'OnCall', loginAccount: 'oncall.ops', createTime: '2026-03-18 09:15:00'),
    UserSummary(id: 3, username: 'SRE', loginAccount: 'sre.lead', createTime: '2026-03-21 16:40:00'),
  ];

  static const operations = [
    OperationRecord(
      id: 1,
      username: 'Admin',
      opType: 'DeployNode',
      remark: 'Node: 上海边缘\nClient Ip: 127.0.0.1',
      createTime: '2026-04-12 07:15:00',
    ),
    OperationRecord(
      id: 2,
      username: 'OnCall',
      opType: 'StopTask',
      remark: 'Task: archive-old-logs\nClient Ip: 10.1.0.3',
      createTime: '2026-04-12 06:40:00',
    ),
    OperationRecord(
      id: 3,
      username: 'SRE',
      opType: 'Login',
      remark: '10.1.0.8',
      createTime: '2026-04-12 05:10:00',
    ),
  ];

  static const taskDetail = TaskDetailBundle(
    task: tasks[0],
    runningLogs: [
      TaskExecutionLog(
        title: 'daily-report-sync #running',
        success: false,
        statusLabel: '运行中',
        execTime: '2026-04-12 08:00:01',
        duration: '24s',
        output: 'Collecting dashboard payload...\\nCompressing summary...\\nUploading report...',
      ),
    ],
    endedLogs: [
      TaskExecutionLog(
        title: 'daily-report-sync #342',
        success: true,
        statusLabel: '成功',
        execTime: '2026-04-11 08:00:03',
        duration: '4.2s',
        output: 'report generated successfully',
      ),
      TaskExecutionLog(
        title: 'daily-report-sync #341',
        success: false,
        statusLabel: '失败',
        execTime: '2026-04-10 08:00:02',
        duration: '7.8s',
        output: 'HTTP 502 from report gateway',
      ),
    ],
  );
}

Map<String, dynamic> asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return <String, dynamic>{};
}

List<dynamic> asList(dynamic value) {
  if (value is List) {
    return value;
  }
  return const <dynamic>[];
}

Map<String, String> asStringMap(dynamic value) {
  return asMap(value).map((key, item) => MapEntry(key, item?.toString() ?? ''));
}

Map<String, bool> asBoolMap(dynamic value) {
  return asMap(value).map((key, item) => MapEntry(key, asBool(item)));
}

int asInt(dynamic value) {
  if (value is int) return value;
  if (value is double) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double asDouble(dynamic value) {
  if (value is double) return value;
  if (value is int) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

bool asBool(dynamic value) {
  if (value is bool) return value;
  final stringValue = value?.toString().toLowerCase();
  return stringValue == '1' || stringValue == 'true';
}

String formatBytes(num bytes) {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  var index = 0;
  var current = bytes.toDouble();
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index++;
  }
  return '${current.toStringAsFixed(current >= 100 ? 0 : 1)} ${units[index]}';
}

extension EmptyStringFallback on String {
  String ifEmpty(String fallback) => trim().isEmpty ? fallback : this;
}
