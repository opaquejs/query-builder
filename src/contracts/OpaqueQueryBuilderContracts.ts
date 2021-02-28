import { ModelAttributes, OpaqueAttributes, OpaqueTable } from "@opaquejs/opaque/lib/contracts/ModelContracts";
import { QueryBuilderInterface } from "@opaquejs/opaque/lib/contracts/QueryBuilderInterface";

type DistributeComparisons<S extends OpaqueAttributes, K extends keyof S> = K extends any
  ? AtomicComparison<K, S[K]>
  : never;

export type NormalizedQuery<Subject extends OpaqueAttributes = Record<string, unknown>> = OpaqueQueryRootEntries &
  NormalizedSubQuery<Subject>;

export type NormalizedSubQuery<Subject extends OpaqueAttributes = Record<string, unknown>> =
  | {}
  | OrConnector<Subject>
  | AndConnector<Subject>
  | DistributeComparisons<Subject, keyof Subject>;

export type OrConnector<Subject extends OpaqueAttributes = Record<string, unknown>> = {
  _or: NormalizedSubQuery<Subject>[];
};
export type AndConnector<Subject extends OpaqueAttributes = Record<string, unknown>> = {
  _and: NormalizedSubQuery<Subject>[];
};

export type GenericAtomicComparison<Key, Comparator, Value> = {
  key: Key;
  comparator: Comparator;
  value: Value;
};

export type ComaparisonTypes<Value> = {
  "==": Value;
  "!=": Value;
  "<": Value;
  ">": Value;
  "<=": Value;
  ">=": Value;
  in: Value[];
};

type DistributeAtomicComparison<Key, Comparator extends keyof ComaparisonTypes<Value>, Value> = Comparator extends any
  ? GenericAtomicComparison<Key, Comparator, ComaparisonTypes<Value>[Comparator]>
  : never;
export type AtomicComparison<Key = string, Value = unknown> = DistributeAtomicComparison<
  Key,
  keyof ComaparisonTypes<any>,
  Value
>;

export type OpaqueQueryRootEntries = {
  _limit?: number;
  _skip?: number;
};

export type OpaqueQueryBuilderModifier<QueryBuilder extends OpaqueQueryBuilderContract<any>> = (
  query: QueryBuilder
) => QueryBuilder;

export interface OpaqueQueryBuilderContract<Model extends OpaqueTable>
  extends QueryBuilderInterface<NormalizedQuery, Model> {
  // Needed for interface
  $getQuery(): NormalizedQuery;

  // Querying
  where<
    Attributes extends ModelAttributes<InstanceType<Model>>,
    Attribute extends keyof Attributes,
    Key extends keyof ComaparisonTypes<any>
  >(
    attribute: Attribute,
    operator: Key,
    value: ComaparisonTypes<Attributes[Attribute]>[Key]
  ): this;
  where<Attributes extends ModelAttributes<InstanceType<Model>>, Attribute extends keyof Attributes>(
    attribute: Attribute,
    value: ComaparisonTypes<Attributes[Attribute]>["=="]
  ): this;
  andWhere: this["where"];
  orWhere: this["where"];
  or(modifier: OpaqueQueryBuilderModifier<this>): this;
  and(modifier: OpaqueQueryBuilderModifier<this>): this;

  limit(limit: number): this;
  skip(skip: number): this;

  get(): Promise<InstanceType<Model>[]>;
  first(): Promise<InstanceType<Model>>;

  update(data: OpaqueAttributes): Promise<void>;
  delete(data: OpaqueAttributes): Promise<void>;
}
